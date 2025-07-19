const express = require("express");
const Driver = require("../models/DriverModel");
const Parcel = require("../models/parcelModel");

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
        const date = new Date(req.params.date);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        
        // Check if selected date is today
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        let query = {
            $or: [{ from: center }, { to: center }],
            parcelDispatchedDate: {
                $gte: date,
                $lt: nextDay
            }
        };

        if (isToday) {
            // For today: show dispatched parcels (currently out for delivery)
            query.status = "DeliveryDispatched";
        } else {
            // For past dates: show failed delivery attempts
            query.status = { $in: ["NotAccepted", "WrongAddress", "Return"] };
        }

        const parcels = await Parcel.find(query)
            .populate('deliveryInformation.staffId', 'staffId name');

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

        res.status(200).json({
            success: true,
            drivers: drivers,
            totalParcels: parcels.length,
            date: req.params.date,
            isToday: isToday
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
