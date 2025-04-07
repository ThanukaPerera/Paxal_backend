const express = require("express");
const router = express.Router();
const { registerNewCustomer, addReceiver } = require("../controllers/customerControllers");
const { registerParcel, getAllParcels, getOneParcel, updateTheParcel, calculatePayment } = require("../controllers/parcelControllers");
const { savePayment } = require("../controllers/paymentController");
const { Vehicle } = require("../models/vehicle");

// REGISTER A PARCEL - STAFF FORM
router.post('/register-parcel', registerNewCustomer, addReceiver,  savePayment, registerParcel );

// GET ALL PARCELS
router.get('/get-all-parcels', getAllParcels);

// GET ONE PARCEL
router.get('/get-one-parcel', getOneParcel);

// UPDATE THE PARCEL
router.post('/update-parcel', updateTheParcel);

router.get('/calculate-payment', calculatePayment);




module.exports = router;