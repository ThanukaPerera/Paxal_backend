// controllers/notificationController.js
const Notification = require('../models/Notification');

const notificationController = {
  createNotification: async (userId, message, type, relatedEntity = null) => {
    const notification = new Notification({
      userId,
      message,
      type,
      isRead: false,
      ...(relatedEntity && {
        relatedEntityId: relatedEntity.id,
        relatedEntityType: relatedEntity.type
      })
    });
    
    return await notification.save();
  },

  getUserNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching notifications' });
    }
  },

  markAsRead: async (req, res) => {
    
      const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true } // Return the updated document
  );
  
  if (!notification) {
    return res.status(404).json({
      status: 'fail',
      message: 'Notification not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      notification
    }
  });
  },

  markAllAsRead: async (req, res) => {
    const result = await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { $set: { isRead: true } }
  );

  // Get updated notifications to return
  const updatedNotifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({
    status: 'success',
    results: updatedNotifications.length,
    data: {
      notifications: updatedNotifications
    }
  });
  }
};

module.exports = notificationController;