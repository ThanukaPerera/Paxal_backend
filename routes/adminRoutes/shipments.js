// ============================================
// routes/admin/shipments.js (Shipment routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");

// Controllers
const fetchShipments = require("../../controllers/adminControllers/shipments/fetchShipments");
const updateShipment = require('../../controllers/adminControllers/shipments/updateShipment');
const deleteShipment = require('../../controllers/adminControllers/shipments/deleteShipment');

// Shipment Routes
router.get("/", authenticateAdmin, fetchShipments);
router.put("/:id", authenticateAdmin, updateShipment);
router.delete("/:id", authenticateAdmin, deleteShipment);

module.exports = router;