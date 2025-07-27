// ============================================
// routes/admin/vehicleSchedules.js 
// Vehicle Schedule Management Routes
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const { authenticateAdmin } = require("../../middleware/adminMiddleware/authMiddleware");

// Controllers
const getAllVehicleSchedules = require('../../controllers/adminControllers/Vehicles/getAllVehicleSchedules');
const getVehicleSchedulesByType = require('../../controllers/adminControllers/Vehicles/getVehicleSchedulesByType');
const getTodayVehicleSchedules = require('../../controllers/adminControllers/Vehicles/getTodayVehicleSchedules');

// Vehicle Schedule Routes

/**
 * GET /api/admin/vehicle-schedules/all
 * Fetch all vehicle schedules with pagination and filtering
 * Query params: type, startDate, endDate, branchId, page, limit
 */
router.get("/all", authenticateAdmin, getAllVehicleSchedules);

/**
 * GET /api/admin/vehicle-schedules/today
 * Fetch today's vehicle schedules optimized for daily operations
 * Query params: branchId, timeSlot, type
 */
router.get("/today", authenticateAdmin, getTodayVehicleSchedules);

/**
 * GET /api/admin/vehicle-schedules/pickup
 * Fetch all pickup schedules with driver and vehicle details
 * Query params: date, branchId, timeSlot
 */
router.get("/pickup", authenticateAdmin, (req, res) => {
  req.params.type = 'pickup';
  getVehicleSchedulesByType(req, res);
});

/**
 * GET /api/admin/vehicle-schedules/delivery  
 * Fetch all delivery schedules with driver and vehicle details
 * Query params: date, branchId, timeSlot
 */
router.get("/delivery", authenticateAdmin, (req, res) => {
  req.params.type = 'delivery';
  getVehicleSchedulesByType(req, res);
});

/**
 * GET /api/admin/vehicle-schedules/:type
 * Generic route for pickup or delivery schedules
 * Params: type (pickup|delivery)
 * Query params: date, branchId, timeSlot
 */
router.get("/:type", authenticateAdmin, getVehicleSchedulesByType);

module.exports = router;
