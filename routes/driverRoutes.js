const express = require("express");
const Driver = require("../models/driverModel");
const Parcel = require("../models/parcelModel");
const isStaffAuthenticated = require("../middleware/staffAuth");

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
router.get("/stats/:center/:date", isStaffAuthenticated, async (req, res) => {
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

module.exports = router;
