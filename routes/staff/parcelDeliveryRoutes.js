const express = require("express");
const router = express.Router();
const {authenticateStaff} = require("../../middleware/adminMiddleware/authMiddleware");
const { getAllDoorstepDeliveryParcels, getAllCollectionCenterDeliveryParcels, updateParcelStatusToDeliveryDispatched, updateParcelAsDelivered, getDoorstepDeliveryStats, getCollectionCenterDeliveryStats } = require("../../controllers/staff/parcelDeliveryController");
const { getOneParcel } = require("../../controllers/staff/parcelControllers");

// get all "doorstep" delivery parcels
router.get("/get-all-doorstep-delivery-parcels",  authenticateStaff, getAllDoorstepDeliveryParcels);

// get information of one parcel
router.get("/view-one-doorstep-delivery-parcel/:parcelId", authenticateStaff, getOneParcel);

// get all "collection_center" delivery parcels
router.get("/get-all-collection-center-delivery-parcels", authenticateStaff, getAllCollectionCenterDeliveryParcels);

// update parcel when assigned to a delivery schedule
router.post("/update-delivery-parcel/:parcelId", authenticateStaff, updateParcelStatusToDeliveryDispatched);

// update parcel as delivered when the receiver collected them at branch
router.post("/update-parcel-as-delivered", authenticateStaff, updateParcelAsDelivered);

// get "doorstep delivery" parcels stats
router.get("/get-doorstep-delivery-stats", authenticateStaff, getDoorstepDeliveryStats);

// get "collection center delivery" parcels stats
router.get("/get-collection-center-delivery-stats", authenticateStaff, getCollectionCenterDeliveryStats);

module.exports = router;

