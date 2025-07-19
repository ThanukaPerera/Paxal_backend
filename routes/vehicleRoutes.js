
const express = require("express");
const router = express.Router();
const { assignVehicle, findVehicleForShipment } = require("../controllers/shipmentManagementControllers/vehicleController");
const shipmentModel = require("../models/B2BShipmentModel");

// Route to find available vehicle for a shipment (for user confirmation)
router.get("/findVehicleForShipment/:id/:deliveryType", async (req, res) => {
    try {
        const shipmentId = req.params.id;
        const shipmentType = req.params.deliveryType;
        const vehicleDetails = await findVehicleForShipment(shipmentId, shipmentType);

        if (!vehicleDetails.success) {
            return res.status(404).json({ 
                success: false,
                message: vehicleDetails.message || "No available vehicle found for the shipment",
                error: vehicleDetails.error
            });
        }

        res.status(200).json({
            success: true,
            message: "Vehicle found successfully",
            data: vehicleDetails
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post("/assignVehicleToShipment/:id/:deliveryType", async (req, res) => {
    try {

        const shipmentId = req.params.id;
        const shipmentType = req.params.deliveryType;
        const vehicleAssigned = await assignVehicle(shipmentId, shipmentType);

        if (!vehicleAssigned) {
            return res.status(404).json({ message: "No available vehicle found for the shipment" });
        }
        res.status(200).json({
            message: "Vehicle assigned successfully",
            data: vehicleAssigned
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router; 