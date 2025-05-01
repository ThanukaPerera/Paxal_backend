const express = require("express");
const router = express.Router();
const {authenticateStaff} = require("../../middleware/adminMiddleware/authMiddleware");
const {
  getAllDeliveryScedules,
  createNewDeliverySchedule,
  assignParcelToExistingDeliverySchedule,
  cancelDeliveryAssignment,

} = require("../../controllers/staff/deliveryScedules");

// get all delivery schedules from the branch
router.get("/get-all-delivery-schedules", authenticateStaff, getAllDeliveryScedules);

// create a new delivery schedule
router.post("/new-delivery-schedule", authenticateStaff, createNewDeliverySchedule);

// assign parcel to an existing delivery schedule
router.post("/select-delivery-schedule", authenticateStaff, assignParcelToExistingDeliverySchedule);

//C cancel the assigned delivery schedule for the parcel
router.post("/cancel-delivery-schdeule", authenticateStaff, cancelDeliveryAssignment);

module.exports = router;
