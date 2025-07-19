// ============================================
// routes/admin/vehicles.js (Vehicle routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");

// Controllers
const fetchVehicles = require("../../controllers/adminControllers/Vehicles/fetchVehicles");
const fetchVehiclesOfBranch = require("../../controllers/adminControllers/Vehicles/fetchVehiclesOfBranch");
const registerVehicle = require("../../controllers/adminControllers/Vehicles/registerVehicle");
const deleteVehicle = require('../../controllers/adminControllers/Vehicles/deleteVehicle');
const updateVehicle = require('../../controllers/adminControllers/Vehicles/updateVehicle');

// Vehicle Routes
router.get("/", authenticateAdmin, fetchVehicles);
router.get("/branch/:branchId", authenticateAdmin, fetchVehiclesOfBranch);
router.post("/", authenticateAdmin, registerVehicle);
router.put("/:id", authenticateAdmin, updateVehicle);
router.delete("/:id", authenticateAdmin, deleteVehicle);

module.exports = router;