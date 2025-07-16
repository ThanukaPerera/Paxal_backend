const express = require("express");
const router = express.Router();
const {authenticateStaff} = require("../../middleware/adminMiddleware/authMiddleware.js");
const {viewAllDropOffupParcels, getQRandTrackingNumberForDropOff, getDropOffsStats,} = require("../../controllers/staff/dropOffControllers.js");

// get all drop-off parcels
router.get( "/get-all-dropOff-parcels", authenticateStaff, viewAllDropOffupParcels);

// update drop-off parcel when collected
router.post( "/register-dropOff/:parcelId", authenticateStaff, getQRandTrackingNumberForDropOff);

// get frop-offs stats
router.get("/get-dropoffs-stats", authenticateStaff, getDropOffsStats)

module.exports = router;
