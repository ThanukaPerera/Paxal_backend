const express = require('express');
const router = express.Router();
const {
  getAllB2BShipments,
  getB2BShipmentById,
  getB2BShipmentsByStatus,
  getB2BShipmentsByBranch,
  getB2BShipmentStats,
  updateB2BShipmentStatus,
  assignVehicleToShipment,
  assignDriverToShipment
} = require('../../controllers/adminControllers/b2bShipmentController');
const { authenticateAdmin } = require('../../middleware/adminMiddleware/authMiddleware');

// Import authentication middleware if needed
// const { isAuthenticated } = require('../../middleware/auth');

/**
 * @route GET /api/admin/b2b-shipments
 * @desc Get all B2B shipments with filters
 * @access Private
 * @query {string} status - Pending, Verified, In Transit, Dispatched, Completed
 * @query {string} deliveryType - Express, Standard
 * @query {string} sourceCenter - Branch ObjectId
 * @query {string} assignedVehicle - Vehicle ObjectId
 * @query {string} assignedDriver - Driver ObjectId
 * @query {string} startDate - Start date filter (YYYY-MM-DD)
 * @query {string} endDate - End date filter (YYYY-MM-DD)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20)
 */
router.get('/', authenticateAdmin,getAllB2BShipments);

/**
 * @route GET /api/admin/b2b-shipments/status/:status
 * @desc Get B2B shipments by status
 * @access Private
 * @param {string} status - Pending, Verified, In Transit, Dispatched, Completed
 * @query {string} deliveryType - Express, Standard
 * @query {string} sourceCenter - Branch ObjectId
 */
router.get('/status/:status', authenticateAdmin, getB2BShipmentsByStatus);

/**
 * @route GET /api/admin/b2b-shipments/branch/:branchId
 * @desc Get B2B shipments by branch (source center)
 * @access Private
 * @param {string} branchId - Branch ObjectId
 * @query {string} status - Filter by status
 * @query {string} deliveryType - Express, Standard
 */
router.get('/branch/:branchId', authenticateAdmin, getB2BShipmentsByBranch);

/**
 * @route GET /api/admin/b2b-shipments/stats
 * @desc Get B2B shipment statistics
 * @access Private
 * @query {string} date - Date for stats (YYYY-MM-DD, default: today)
 * @query {string} period - day, week, month (default: day)
 */
router.get('/stats', authenticateAdmin, getB2BShipmentStats);

/**
 * @route GET /api/admin/b2b-shipments/:shipmentId
 * @desc Get B2B shipment by ID with full details
 * @access Private
 * @param {string} shipmentId - Shipment ObjectId
 */
router.get('/:shipmentId', authenticateAdmin, getB2BShipmentById);

/**
 * @route PUT /api/admin/b2b-shipments/:shipmentId/status
 * @desc Update B2B shipment status
 * @access Private
 * @param {string} shipmentId - Shipment ObjectId
 * @body {string} status - New status
 */
router.put('/:shipmentId/status', authenticateAdmin, updateB2BShipmentStatus);

/**
 * @route PUT /api/admin/b2b-shipments/:shipmentId/assign-vehicle
 * @desc Assign vehicle to B2B shipment
 * @access Private
 * @param {string} shipmentId - Shipment ObjectId
 * @body {string} vehicleId - Vehicle ObjectId
 */
router.put('/:shipmentId/assign-vehicle', authenticateAdmin, assignVehicleToShipment);

/**
 * @route PUT /api/admin/b2b-shipments/:shipmentId/assign-driver
 * @desc Assign driver to B2B shipment
 * @access Private
 * @param {string} shipmentId - Shipment ObjectId
 * @body {string} driverId - Driver ObjectId
 */
router.put('/:shipmentId/assign-driver', authenticateAdmin, assignDriverToShipment);

module.exports = router;
