const express = require("express");
const router = express.Router();
const { registerParcel, getAllParcels, getOneParcel } = require("../../controllers/staff/parcelControllers");
const {authenticateStaff} = require("../../middleware/adminMiddleware/authMiddleware");
const { calculatePayment } = require("../../controllers/staff/paymentController");

// register a new parcel by staff
router.post('/register-parcel', authenticateStaff, registerParcel );

// get all parcels
router.get('/get-all-parcels', authenticateStaff, getAllParcels);

// get one parcel
router.get('/get-one-parcel/:parcelId',authenticateStaff, getOneParcel );

// get paymnet for a parcel - parcel form
router.get('/calculate-payment', authenticateStaff, calculatePayment);

module.exports = router;