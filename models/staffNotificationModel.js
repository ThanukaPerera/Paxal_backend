const mongoose = require('mongoose');

const staffNotificationSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedEntityId: { type: mongoose.Schema.Types.ObjectId },
  relatedEntityType: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('staffNotification', staffNotificationSchema);
