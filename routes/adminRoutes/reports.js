const express = require("express");
const router = express.Router();

// Middleware
const { authenticateAdmin } = require("../../middleware/adminMiddleware/authMiddleware");

// Report Controllers
const { generateReport } = require("../../controllers/adminControllers/reports/generateReport");
const { getDashboardAnalytics } = require("../../controllers/adminControllers/reports/getDashboardAnalytics");

// Dashboard Analytics Route
router.get("/dashboard", authenticateAdmin, getDashboardAnalytics);

// Standard Report Generation Routes
router.get("/generate", authenticateAdmin, generateReport);





module.exports = router;
