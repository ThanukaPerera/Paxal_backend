const express = require("express");
const router = express.Router();
const { 
    getAllPickupSchedulesForDate, 
    assignparcelToExsistingPickup, 
    createNewPickupSchedule, 
    cancelPickupAssignment, 
    checkParcelAssignment 
} = require("../../controllers/staff/pickupScheduleController");
const {authenticateStaff} = require("../../middlewares/authMiddleware");

// get all pickup schedules created from the branch for a given day
router.get('/get-all-pickup-schedules', getAllPickupSchedulesForDate);

// assign the parcel to an existing pickup schedule
router.post('/select-pickup-schedule',  assignparcelToExsistingPickup);

// create a new pickup schedule and assign the pracle
router.post('/new-pickup-schedule', authenticateStaff, createNewPickupSchedule)

// remove the parcel from and assigned pickup schedule
router.post('/cancel-pickup-schdeule', cancelPickupAssignment)

// check the parcel assignment to a pickup schedule
router.get('/check-parcel-assignment', authenticateStaff, checkParcelAssignment)

module.exports = router;