const express = require("express");
const Driver = require("../models/DriverModel");

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

module.exports = router;
