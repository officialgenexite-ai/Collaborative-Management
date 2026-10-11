const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      default: null // null while the timer is running
    },
    durationSeconds: {
      type: Number,
      default: 0 // computed when the timer is stopped
    }
  },
  { timestamps: true }
);

timeLogSchema.index({ userId: 1, endTime: 1 }); // fast lookup of "my currently running timer"

module.exports = mongoose.model('TimeLog', timeLogSchema);
