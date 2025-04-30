const express = require("express");
const router = express.Router();
const { authenticateStaff } = require("../../middlewares/authMiddleware");
const { getAllDoorstepDeliveryParcels, getAllCollectionCenterDeliveryParcels, updateParcelStatusToDeliveryDispatched } = require("../../controllers/staff/parcelDeliveryController");
const { getOneParcel } = require("../../controllers/staff/parcelControllers");

// get all "doorstep" delivery parcels
router.get("/get-all-doorstep-delivery-parcels",  authenticateStaff, getAllDoorstepDeliveryParcels);

// get information of one parcel
router.get("/view-one-doorstep-delivery-parcel/:parcelId", authenticateStaff, getOneParcel);

// get all "collection_center" delivery parcels
router.get("/get-all-collection-center-delivery-parcels", authenticateStaff, getAllCollectionCenterDeliveryParcels);

// update parcel when assigned to a delivery schedule
router.post("/update-delivery-parcel/:parcelId", authenticateStaff, updateParcelStatusToDeliveryDispatched)

module.exports = router;

