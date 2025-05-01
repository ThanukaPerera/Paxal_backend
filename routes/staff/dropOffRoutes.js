const express = require("express");


const {authenticateStaff} = require("../../middleware/adminMiddleware/authMiddleware.js");


const router = express.Router();

const {viewAllDropOffupParcels, getQRandTrackingNumberForDropOff,} = require("../../controllers/staff/dropOffControllers.js");


// get all drop-off parcels
router.get( "/get-all-dropOff-parcels", authenticateStaff, viewAllDropOffupParcels);

// update drop-off parcel when collected
router.post( "/register-dropOff/:parcelId", authenticateStaff, getQRandTrackingNumberForDropOff);

module.exports = router;
