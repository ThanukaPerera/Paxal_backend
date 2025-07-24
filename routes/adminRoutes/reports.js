const express = require("express");
const router = express.Router();

// Middleware
const { authenticateAdmin } = require("../../middleware/adminMiddleware/authMiddleware");

// Report Controllers
const { generateReport } = require("../../controllers/adminControllers/reports/generateReport");
const { getDashboardAnalytics } = require("../../controllers/adminControllers/reports/getDashboardAnalytics");
const { generateAIReport, getAIInsights } = require("../../controllers/adminControllers/aiReportController");
const { 
  exportReportPDF, 
  exportReportCSV, 
  exportDataCSV, 
  getExportOptions 
} = require("../../controllers/adminControllers/exportController");

// Dashboard Analytics Route
router.get("/dashboard", authenticateAdmin, getDashboardAnalytics);

// Standard Report Generation Routes
router.get("/generate", authenticateAdmin, generateReport);

// AI-Powered Report Generation Routes
router.get("/ai-report", authenticateAdmin, generateAIReport);
router.post("/ai-insights", authenticateAdmin, getAIInsights);

// Export Routes
router.get("/export/options", authenticateAdmin, getExportOptions);
router.get("/export/pdf", authenticateAdmin, exportReportPDF);
router.get("/export/csv", authenticateAdmin, exportReportCSV);
router.get("/export/data/:dataType", authenticateAdmin, exportDataCSV);

// Export Report Routes (Future implementation)
// router.get("/export/csv", authenticateAdmin, exportCSV);
// router.get("/export/pdf", authenticateAdmin, exportPDF);
// router.get("/export/excel", authenticateAdmin, exportExcel);

module.exports = router;
