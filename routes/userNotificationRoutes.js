const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const isAuthenticated = require("../middleware/isAuthenticated.js");

router.get('/', isAuthenticated, notificationController.getUserNotifications);
router.post('/mark-as-read/:id', isAuthenticated, notificationController.markAsRead);
router.post('/mark-all-read', isAuthenticated, notificationController.markAllAsRead);

module.exports=router;