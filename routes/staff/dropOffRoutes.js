const express = require("express");
const authenticateStaff = require("../../middlewares/authMiddleware");
const {
  viewAllDropOffupParcels,
} = require("../../controllers/staff/dropOffControllers.js");
const router = express.Router();

// GET ALL DROP-OFF PARCELS
router.get(
  "/get-all-dropOff-parcels",
  authenticateStaff,
  viewAllDropOffupParcels
);

module.exports = router;
