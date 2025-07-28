const express = require("express");
const router = express.Router();

// Import middleware
const { authenticateAdmin } = require("../../middleware/adminMiddleware/authMiddleware");

// Import AI controllers
const { 
  generateAIReport, 
  getAIInsights,
  getBusinessMetrics,
  getPerformanceAnalysis 
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

/**
 * @route   GET /api/admin/ai/metrics
 * @desc    Get business metrics for AI analysis
 * @access  Admin only
 * @query   { dateRange, branchId }
 */
router.get("/metrics", authenticateAdmin, getBusinessMetrics);

/**
 * @route   GET /api/admin/ai/performance
 * @desc    Get performance analysis data
 * @access  Admin only
 * @query   { dateRange, branchId, analysisType }
 */
router.get("/performance", authenticateAdmin, getPerformanceAnalysis);

module.exports = router;