const express = require("express");
const router = express.Router();
const { getAllPickupSchedulesForDate } = require("../../controllers/staff/vehicleScheduleController");
const {authenticateStaff} = require("../../middlewares/authMiddleware");

// GET ALL Pickup Schedules For a Given Day
router.get('/get-all-pickup-schedules', getAllPickupSchedulesForDate);

module.exports = router;