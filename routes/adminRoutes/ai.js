const express = require("express");
const router = express.Router();

// Import middleware
const { authenticateAdmin } = require("../../middleware/adminMiddleware/authMiddleware");

// Import AI controllers
const { 
  generateAIReport, 
  getAIInsights
} = require("../../controllers/adminControllers/aiReportController");

/**
 * @route   POST /api/admin/ai/generate-report
 * @desc    Generate comprehensive AI-powered business report
 * @access  Admin only
 * @body    { reportType, dateRange, branchId }
 */
router.post("/generate-report", authenticateAdmin, generateAIReport);

/**
 * @route   POST /api/admin/ai/insights
 * @desc    Get AI insights for existing report data
 * @access  Admin only
 * @body    { reportData, reportType }
 */
router.post("/insights", authenticateAdmin, getAIInsights);

module.exports = router;