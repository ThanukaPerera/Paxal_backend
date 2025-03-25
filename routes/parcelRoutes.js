const express = require("express");
const router = express.Router();
const { registerNewCustomer, addReceiver } = require("../controllers/customerControllers");
const { registerParcel } = require("../controllers/parcelControllers");

// REGISTER A PARCEL - STAFF FORM
router.post('/register-parcel', registerNewCustomer, addReceiver, registerParcel )




module.exports = router;