const express = require("express");
const Driver = require("../../models/driverModel");
const Parcel = require("../../models/parcelModel");
const {
  getMyVehicleSchedules,
  getTodaySchedules,
  updateParcelStatusInSchedule
} = require('../../controllers/adminControllers/Vehicles/driverScheduleController');

const router = express.Router();

// Add a new driver
router.post("/add", async (req, res) => {
  try {
    const driver = new Driver(req.body);
    await driver.save();
    res.status(201).json({ message: "Driver added successfully", driver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all drivers
router.get("/", async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get driver parcel statistics for a specific date
router.get("/stats/:center/:date", async (req, res) => {
    try {
        const center = req.params.center;
        
        // Parse date properly to avoid timezone issues
        const dateStr = req.params.date;
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day, 0, 0, 0, 0); // Local timezone
        const nextDay = new Date(year, month - 1, day, 23, 59, 59, 999); // End of day
        
        console.log("=== DRIVER STATS API CALLED ===");
        console.log("Center:", center);
        console.log("Date received:", req.params.date);
        console.log("Date parsed (start):", date);
        console.log("Date parsed (end):", nextDay);
        
        // Check if selected date is today
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        console.log("Is today?", isToday);
        console.log("Today:", today.toDateString());
        console.log("Selected date:", date.toDateString());
        
        // 5. Dispatched Parcels & Driver Details: arrivedToCollectionCenterTime === clickedDate && status === "DeliveryDispatched"
        let query = {
            to: center,
            arrivedToCollectionCenterTime: {
                $gte: date,
                $lte: nextDay
            },
            status: "DeliveryDispatched" // Only parcels currently dispatched for delivery
        };
        
        console.log("Query constructed:", JSON.stringify(query, null, 2));

        const parcels = await Parcel.find(query)
            .populate('deliveryInformation.staffId', 'staffId name');
            
        console.log("Parcels found:", parcels.length);

        // Group parcels by delivery staff
        const driverGroups = {};
        
        parcels.forEach(parcel => {
            const staffId = parcel.deliveryInformation?.staffId;
            if (!staffId) {
                // If no staff assigned, create a default entry
                const key = 'unassigned';
                if (!driverGroups[key]) {
                    driverGroups[key] = {
                        driverId: 'UNASSIGNED',
                        driverName: 'Unassigned',
                        parcels: 0
                    };
                }
                driverGroups[key].parcels++;
                return;
            }

            const key = staffId._id.toString();
            if (!driverGroups[key]) {
                driverGroups[key] = {
                    driverId: staffId.staffId || key,
                    driverName: staffId.name || 'Unknown',
                    parcels: 0
                };
            }
            driverGroups[key].parcels++;
        });

        // Convert to array and sort by parcel count
        const drivers = Object.values(driverGroups).sort((a, b) => b.parcels - a.parcels);
        
        console.log("Driver groups processed:", Object.keys(driverGroups).length);
        console.log("Final drivers array:", drivers);

        res.status(200).json({
            success: true,
            drivers: drivers,
            totalParcels: parcels.length,
            date: req.params.date,
            isToday: isToday
        });

    } catch (error) {
        console.error("=== DRIVER STATS ERROR ===");
        console.error("Error:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// === VEHICLE SCHEDULE ROUTES ===

/**
 * @route GET /api/drivers/schedules
 * @desc Get driver's own vehicle schedules
 * @access Private (Driver)
 * @query {string} startDate - Start date filter (YYYY-MM-DD)
 * @query {string} endDate - End date filter (YYYY-MM-DD)
 * @query {string} type - pickup or delivery
 */
router.get('/schedules', getMyVehicleSchedules);

/**
 * @route GET /api/drivers/schedules/today
 * @desc Get driver's today schedules
 * @access Private (Driver)
 */
router.get('/schedules/today', getTodaySchedules);

/**
 * @route PUT /api/drivers/schedules/:scheduleId/parcels/:parcelId/status
 * @desc Update parcel status in schedule (for drivers)
 * @access Private (Driver)
 * @param {string} scheduleId - Schedule ObjectId
 * @param {string} parcelId - Parcel ObjectId
 * @body {string} status - New status (PickedUp, Delivered, NotAccepted, WrongAddress)
 * @body {string} notes - Optional notes
 */
router.put('/schedules/:scheduleId/parcels/:parcelId/status', updateParcelStatusInSchedule);

/**
 * @route GET /api/drivers/schedules/:driverId
 * @desc Get schedules for specific driver (for admin use)
 * @access Private (Admin)
 * @param {string} driverId - Driver ObjectId
 */
router.get('/schedules/:driverId', getMyVehicleSchedules);

module.exports = router;
