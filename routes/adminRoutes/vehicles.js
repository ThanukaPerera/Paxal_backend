// ============================================
// routes/admin/vehicles.js (Vehicle routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");
const {
  validateVehicleRegistration,
  validateVehicleUpdate,
  validateVehicleId
} = require("../../middleware/adminMiddleware/vehicleValidationMiddleware");

// Controllers
const fetchVehicles = require("../../controllers/adminControllers/Vehicles/fetchVehicles");
const fetchVehiclesOfBranch = require("../../controllers/adminControllers/Vehicles/fetchVehiclesOfBranch");
const registerVehicle = require("../../controllers/adminControllers/Vehicles/registerVehicle");
const deleteVehicle = require('../../controllers/adminControllers/Vehicles/deleteVehicle');
const updateVehicle = require('../../controllers/adminControllers/Vehicles/updateVehicle');

// New detailed endpoints
const fetchVehicleDetails = require('../../controllers/adminControllers/Vehicles/fetchVehicleDetails');
const fetchVehicleSchedules = require('../../controllers/adminControllers/Vehicles/fetchVehicleSchedules');
const fetchVehicleParcels = require('../../controllers/adminControllers/Vehicles/fetchVehicleParcels');
const getVehicleAnalytics = require('../../controllers/adminControllers/Vehicles/getVehicleAnalytics');

// Basic Vehicle Routes
router.get("/", authenticateAdmin, fetchVehicles);
router.get("/branch/:branchId", authenticateAdmin, fetchVehiclesOfBranch);
router.post("/", authenticateAdmin, validateVehicleRegistration, registerVehicle);
router.put("/:id", authenticateAdmin, validateVehicleUpdate, updateVehicle);
router.delete("/:id", authenticateAdmin, validateVehicleId, deleteVehicle);

// Detailed Vehicle Information Routes
router.get("/:id/details", authenticateAdmin, validateVehicleId, fetchVehicleDetails);
router.get("/:id/schedules", authenticateAdmin, validateVehicleId, fetchVehicleSchedules);
router.get("/:id/parcels", authenticateAdmin, validateVehicleId, fetchVehicleParcels);
router.get("/:id/analytics", authenticateAdmin, validateVehicleId, getVehicleAnalytics);

module.exports = router;