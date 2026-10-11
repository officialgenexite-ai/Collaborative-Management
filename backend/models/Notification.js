const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['mention', 'assignment', 'invite', 'comment_reply', 'status_change'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    entityType: {
      type: String,
      enum: ['Task', 'Comment', 'Project', 'Workspace'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    // Frontend route to navigate to when the notification is clicked,
    // e.g. "/projects/<id>/tasks" — built by the caller, not derived here.
    link: {
      type: String,
      default: ''
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
