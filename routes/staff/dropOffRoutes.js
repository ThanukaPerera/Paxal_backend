const express = require("express");
const router = express.Router();
const {authenticateStaff} = require("../../middlewares/authMiddleware");
const {viewAllDropOffupParcels, getQRandTrackingNumberForDropOff,} = require("../../controllers/staff/dropOffControllers.js");


// get all drop-off parcels
router.get( "/get-all-dropOff-parcels", authenticateStaff, viewAllDropOffupParcels);

// update drop-off parcel when collected
router.post( "/register-dropOff/:parcelId", authenticateStaff, getQRandTrackingNumberForDropOff);

module.exports = router;
