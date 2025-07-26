const Notification = require('../../models/staffNotificationModel');

const staffNotificationController = {
  // Get notifications for staff
  getStaffNotifications: async (req, res) => {
    try {
     
      
      const notifications = await Notification.find({ staffId: req.staff._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();

      console.log('Found notifications count:', notifications.length);
     
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error fetching staff notifications:', error);
      res.status(500).json({ message: 'Error fetching staff notifications' });
    }
  },

  // Mark a specific notification as read
  markAsRead: async (req, res) => {
    try {
     
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );

      if (!notification) {
     
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

   

      res.status(200).json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark as read' });
    }
  },

  // Mark all notifications as read for staff
  markAllAsReadForStaff: async (req, res) => {
    try {
      await Notification.updateMany(
        { staffId: req.staff._id, isRead: false },
        { $set: { isRead: true } }
      );

      const updatedNotifications = await Notification.find({ staffId: req.staff._id })
        .sort({ createdAt: -1 })
        .limit(20);

      res.status(200).json({
        success: true,
        data: updatedNotifications
      });
    } catch (error) {
      console.error('Error marking all as read for staff:', error);
      res.status(500).json({ message: 'Failed to mark all as read for staff' });
    }
  },

  // Create notification for staff when shipment is completed
  createStaffNotification: async (staffId, message, type = 'shipment', relatedEntity = null) => {
    try {
     
      
      const notification = new Notification({
        staffId: staffId,
        message,
        type,
        isRead: false,
        ...(relatedEntity && {
          relatedEntityId: relatedEntity.id,
          relatedEntityType: relatedEntity.type
        })
      });

      const savedNotification = await notification.save();
    

      return savedNotification;
    } catch (error) {
      console.error('Error creating staff notification:', error);
      throw error;
    }
  }
};

module.exports = staffNotificationController;