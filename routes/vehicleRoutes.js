
const express = require("express");
const router = express.Router();
const { 
    assignVehicle, 
    findVehicleForShipment, 
    getPendingB2BShipments,
    assignVehicleManual,
    assignVehicleSmart,
    confirmVehicleAssignment,
    // PHASE 4 - Additional Parcels functionality
    getAvailableParcelsForShipment,
    addParcelsToShipment,
    // ENHANCED API
    enhancedFindVehicleForShipment,
    findAvailableParcelsForRoute,
    addParcelsToCurrentShipment
} = require("../controllers/shipmentManagementControllers/vehicleController");
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

// Route to get pending B2B shipments for a specific staff member's center
router.get("/b2b/shipments/:staffId", getPendingB2BShipments);

// PHASE 2 - Vehicle Assignment Routes
// Manual vehicle assignment
router.post("/b2b/shipments/:shipmentId/assign-vehicle/manual", assignVehicleManual);

// Smart vehicle assignment (find vehicle using 3-step search)
router.get("/b2b/shipments/:shipmentId/assign-vehicle/smart", assignVehicleSmart);

// Confirm vehicle assignment
router.post("/b2b/shipments/:shipmentId/assign-vehicle/confirm", confirmVehicleAssignment);

// PHASE 4 - Additional Parcels Routes
// Get available additional parcels for a shipment with assigned vehicle
router.get("/b2b/shipments/:shipmentId/available-parcels", getAvailableParcelsForShipment);

// Add selected parcels to shipment
router.post("/b2b/shipments/:shipmentId/add-parcels", addParcelsToShipment);

// ENHANCED VEHICLE ASSIGNMENT API - Complete 6-step workflow
router.get("/b2b/shipments/:shipmentId/:deliveryType/enhanced-find-vehicle", enhancedFindVehicleForShipment);

// Add parcels to current shipment and finalize assignment
router.post("/b2b/shipments/:shipmentId/add-parcels-to-current", addParcelsToCurrentShipment);

module.exports = router; 