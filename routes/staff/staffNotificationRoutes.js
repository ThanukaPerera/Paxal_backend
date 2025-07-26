const express = require('express');
const router = express.Router();
const staffNotificationController = require('../../controllers/staff/notificationController.js');
const isStaffAuthenticated = require("../../middleware/staffAuth.js");

// Get notifications for staff
router.get('/', isStaffAuthenticated, staffNotificationController.getStaffNotifications);

// Mark notification as read
router.post('/mark-as-read/:id', isStaffAuthenticated, staffNotificationController.markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', isStaffAuthenticated, staffNotificationController.markAllAsReadForStaff);

module.exports = router;
