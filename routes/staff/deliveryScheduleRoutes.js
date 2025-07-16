const express = require("express");
const router = express.Router();
const {authenticateStaff} = require("../../middleware/adminMiddleware/authMiddleware");
const {
  getAllDeliveryScedules,
  createNewDeliverySchedule,
  assignParcelToExistingDeliverySchedule,
  cancelDeliveryAssignment,
  checkParcelAssignment,
  createExpressDeliverySchedule,

} = require("../../controllers/staff/deliveryScedules");

// get all delivery schedules from the branch
router.get("/get-all-delivery-schedules", authenticateStaff, getAllDeliveryScedules);

// create a new delivery schedule
router.post("/new-delivery-schedule", authenticateStaff, createNewDeliverySchedule);

// assign parcel to an existing delivery schedule
router.post("/select-delivery-schedule", authenticateStaff, assignParcelToExistingDeliverySchedule);

// cancel the assigned delivery schedule for the parcel
router.post("/cancel-delivery-schdeule", authenticateStaff, cancelDeliveryAssignment);

// check the parcel assignment to a delivery schedule
router.get('/check-parcel-assignment', authenticateStaff, checkParcelAssignment)

// create a new express delivery schedule
router.post("/new-express-delivery-schedule", authenticateStaff, createExpressDeliverySchedule);

module.exports = router;
