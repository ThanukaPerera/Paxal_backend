const express = require("express");
const router = express.Router();

// Middleware
const { authenticateAdmin } = require("../../middleware/adminMiddleware/authMiddleware");

// Report Controllers
const { generateReport } = require("../../controllers/adminControllers/reports/generateReport");
const { getDashboardAnalytics } = require("../../controllers/adminControllers/reports/getDashboardAnalytics");
const { exportReportCSV } = require("../../controllers/adminControllers/exportController");
const { exportComprehensiveReportCSV } = require("../../controllers/adminControllers/reports/exportComprehensiveCSV");

// Dashboard Analytics Route
router.get("/dashboard", authenticateAdmin, getDashboardAnalytics);

// Standard Report Generation Routes
router.get("/generate", authenticateAdmin, generateReport);

// Export Routes
router.get("/export/csv", authenticateAdmin, exportReportCSV);
router.get("/export/comprehensive-csv", authenticateAdmin, exportComprehensiveReportCSV);




module.exports = router;
