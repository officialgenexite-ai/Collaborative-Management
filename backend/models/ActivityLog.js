const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['Task', 'Project', 'Workspace'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    // Denormalized so a whole project's feed can be queried in one shot,
    // without joining Task -> Project for every single entry.
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true
    },
    action: {
      type: String,
      required: true
      // e.g. 'task_created', 'status_changed', 'assignees_updated',
      // 'task_updated', 'task_deleted', 'project_created',
      // 'project_updated', 'project_archived'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
