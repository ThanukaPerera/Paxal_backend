//mobile.js
const express = require("express");
const { Driver , Parcel, Pickup} = require("../models/models");  // ✅ Adjust if your model is different
 
const router = express.Router();

// ✅ Register a new driver (Save username & password directly)
router.post("/driver/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if driver already exists
        const existingDriver = await Driver.findOne({ email });
        if (existingDriver) {
            return res.status(400).json({ message: "Email already taken" });
        }

        // Save username and password (without hashing)
        const newDriver = new Driver({ username, password });

        await newDriver.save();
        res.status(201).json({ message: "Driver registered successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error registering driver", error });
    }
});

// ✅ Driver login (Compare entered password with stored password)
router.post("/driver/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Hitting driver login route");

        // Find driver by username
        const driver = await Driver.findOne({email });
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Check if the password matches
        if (driver.password !== password) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // If login successful, return success response
        res.status(200).json({ message: "Login successful", driverId: driver._id });

    } catch (error) {
        res.status(500).json({ message: "Error during login", error });
    }
});

// ✅ Fetch Parcel Counts (Assigned, Picked Up, Pending)
router.get("/parcel-counts", async (req, res) => {
    try {
        const assignedCount = await Parcel.countDocuments({ status: 'Assigned' });
        const pickedUpCount = await Parcel.countDocuments({ status: 'Picked Up' });
        const pendingCount = await Parcel.countDocuments({ status: 'Pending' });

        console.log('Assigned:', assignedCount);
        console.log('Picked Up:', pickedUpCount);
        console.log('Pending:', pendingCount);  
                // Send the counts as a response
        res.status(200).json({
            assignedCount,
            pickedUpCount,
            pendingCount
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching parcel counts", error });
    }
});


router.post("/updateParcelStatus", async (req, res) => {
    try {
        const { parcelId, status } = req.body;

        // Update parcel status in MongoDB
        const updatedParcel = await Parcel.findOneAndUpdate(
            { parcelId : parcelId },
            { status },
            { new: true } // Return updated document
        );

        if (!updatedParcel) {
            return res.status(404).json({ message: "Parcel not found" });
        }

        console.log(`Parcel ID ${parcelId} status updated to: ${status}`);

        res.status(200).json({ message: "Parcel status updated", parcel: updatedParcel });

    } catch (error) {
        console.error("Error updating parcel status:", error);
        res.status(500).json({ message: "Server error", error });
    }
});

module.exports = router;



