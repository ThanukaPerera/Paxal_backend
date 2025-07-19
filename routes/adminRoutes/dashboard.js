// ============================================
// routes/admin/dashboard.js (Dashboard routes)
// ============================================
const express = require("express");
const router = express.Router();

// Middleware
const {authenticateAdmin} = require("../../middleware/adminMiddleware/authMiddleware");

// Controllers
const getParcelCountByStatus = require("../../controllers/adminControllers/Parcel/getParcelCountByStatus");
const barChart = require("../../controllers/adminControllers/Parcel/parcelBarChart");

// Dashboard Routes
router.get("/pie-chart", authenticateAdmin, getParcelCountByStatus);
router.get("/bar-chart", authenticateAdmin, barChart);

module.exports = router;