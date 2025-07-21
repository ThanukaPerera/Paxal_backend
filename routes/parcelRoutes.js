const express = require("express");
const router = express.Router();
const { notifyNextCenter } = require("../controllers/shipmentManagementControllers/standardShipmentNotificationController");
const { addParcel } = require("../controllers/parcelController.js");
const  isAuthenticated= require("../middleware/isAuthenticated.js");
const {getUserParcels}=require("../controllers/parcelController.js");


// Define routes
router.post("/addparcel",isAuthenticated, addParcel); // Add a new parcel
router.get("/user_parcels", isAuthenticated, getUserParcels);


// notify the standard shipment
router.get('/notifyAboutShipment/:id', async (req, res) => {
    try {
        const shipmentId = req.params.id;
        const finalShipment = await notifyNextCenter(shipmentId);
        console.log('Notified about shipment:', finalShipment);
        res.status(201).json({ message: "Standard Shipment created successfully", finalShipment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;