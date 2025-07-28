// const express = require('express');
// const router = express.Router();
// const {
//   getAllVehicleSchedules,
//   getVehicleSchedulesByType,
//   getVehicleScheduleById,
//   getVehicleSchedulesByDriver,
//   getVehicleScheduleStats
// } = require('../../controllers/adminControllers/Vehicles/vehicleScheduleController');

// // Import authentication middleware if needed
// // const { isAuthenticated } = require('../middleware/auth');

// /**
//  * @route GET /api/vehicle-schedules
//  * @desc Get all vehicle schedules with filters
//  * @access Private
//  * @query {string} type - pickup or delivery
//  * @query {string} scheduleDate - YYYY-MM-DD format
//  * @query {string} branchId - Branch ObjectId
//  * @query {string} timeSlot - "08:00 - 12:00" or "13:00 - 17:00"
//  * @query {number} page - Page number (default: 1)
//  * @query {number} limit - Items per page (default: 20)
//  */
// router.get('/', getAllVehicleSchedules);

// /**
//  * @route GET /api/vehicle-schedules/type/:type
//  * @desc Get vehicle schedules by type (pickup or delivery)
//  * @access Private
//  * @param {string} type - pickup or delivery
//  * @query {string} scheduleDate - YYYY-MM-DD format
//  * @query {string} branchId - Branch ObjectId
//  * @query {string} timeSlot - "08:00 - 12:00" or "13:00 - 17:00"
//  */
// router.get('/type/:type', getVehicleSchedulesByType);

// /**
//  * @route GET /api/vehicle-schedules/driver/:driverId
//  * @desc Get vehicle schedules by driver ID
//  * @access Private
//  * @param {string} driverId - Driver ObjectId
//  * @query {string} startDate - Start date filter (YYYY-MM-DD)
//  * @query {string} endDate - End date filter (YYYY-MM-DD)
//  */
// router.get('/driver/:driverId', getVehicleSchedulesByDriver);

// /**
//  * @route GET /api/vehicle-schedules/stats
//  * @desc Get vehicle schedule statistics
//  * @access Private
//  * @query {string} date - Date for stats (YYYY-MM-DD, default: today)
//  */
// router.get('/stats', getVehicleScheduleStats);

// /**
//  * @route GET /api/vehicle-schedules/:scheduleId
//  * @desc Get vehicle schedule by ID with full details
//  * @access Private
//  * @param {string} scheduleId - Schedule ObjectId
//  */
// router.get('/:scheduleId', getVehicleScheduleById);

// module.exports = router;
