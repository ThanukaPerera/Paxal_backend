const express = require("express");
const router = express.Router();
const { processStandardShipment } = require("../controllers/shipmentManagementControllers/standardShipmentNotificationController");
const isStaffAuthenticated = require("../middleware/staffAuth");

// notify the standard shipment
router.post('/notifyAboutShipment/:id', isStaffAuthenticated, async (req, res) => {
    try {
        const shipmentId = req.params.id;
        console.log('Received shipment ID:', shipmentId);
        const finalShipment = await processStandardShipment(shipmentId);
        console.log('Notified about shipment:', finalShipment);
        res.status(201).json({ message: "Standard Shipment created successfully", finalShipment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    
  }
});




const {
  notifyNextCenter,
} = require("../controllers/shipmentManagementControllers/standardShipmentNotificationController");

// notify the standard shipment
router.get("/notifyAboutShipment/:id", async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const finalShipment = await notifyNextCenter(shipmentId);
    console.log("Notified about shipment:", finalShipment);
    res
      .status(201)
      .json({
        message: "Standard Shipment created successfully",
        finalShipment,
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
