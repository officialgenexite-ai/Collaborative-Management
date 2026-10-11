const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: ''
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'In Review', 'Done'],
      default: 'To Do'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    dueDate: {
      type: Date
    },
    startDate: {
      type: Date // reserved for Gantt/Timeline view (Phase 4)
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task' // reserved for Gantt/Timeline view (Phase 4)
      }
    ],
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null // non-null means this is a subtask
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    order: {
      type: Number,
      default: 0 // drag-order for List/Board views
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'frustrated'],
      default: null
    }
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1, isArchived: 1 });
taskSchema.index({ parentTaskId: 1 });

module.exports = mongoose.model('Task', taskSchema);
