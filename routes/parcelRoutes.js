const express = require("express");

const { addParcel } = require("../controllers/parcelController.js");
const  isAuthenticated= require("../middleware/isAuthenticated.js");
const {getUserParcels}=require("../controllers/parcelController.js");

const router = express.Router();




// Define routes
router.post("/addparcel",isAuthenticated, addParcel); // Add a new parcel
router.get("/user_parcels", isAuthenticated, getUserParcels);


module.exports = router;
