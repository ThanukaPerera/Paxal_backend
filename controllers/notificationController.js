const Notification = require('../models/Notification');

const notificationController = {
  // Create a new notification
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

  // Get latest 10 notifications for a user
  getUserNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();

      res.json(notifications);
    } catch (error) {

//This was the code removed when I am merging the branch.If you want to add it back, uncomment the code below.
   
    //   res.json({
    //     success: true,
    //     data: notifications
    //   });
    // } catch (error) {
    //   console.error('Error fetching notifications:', error);

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


//This code was removed when I am merging the branch.If you want to add it back, uncomment the code below.

//   // Mark a specific notification as read
//   markAsRead: async (req, res) => {
//     try {
//       const notification = await Notification.findByIdAndUpdate(
//         req.params.id,
//         { isRead: true },
//         { new: true }
//       );

//       if (!notification) {
//         return res.status(404).json({
//           success: false,
//           message: 'Notification not found'
//         });
//       }

//       res.status(200).json({
//         success: true,
//         data: notification
//       });
//     } catch (error) {
//       console.error('Error marking notification as read:', error);
//       res.status(500).json({ message: 'Failed to mark as read' });
//     }
//   },

//   // Mark all notifications as read for a user
//   markAllAsRead: async (req, res) => {
//     try {
//       await Notification.updateMany(
//         { userId: req.user.id, isRead: false },
//         { $set: { isRead: true } }
//       );

//       const updatedNotifications = await Notification.find({ userId: req.user.id })
//         .sort({ createdAt: -1 })
//         .limit(20);

//       res.status(200).json({
//         success: true,
//         data: updatedNotifications
//       });
//     } catch (error) {
//       console.error('Error marking all as read:', error);
//       res.status(500).json({ message: 'Failed to mark all as read' });
//     }
//   }
// };

// module.exports = notificationController;