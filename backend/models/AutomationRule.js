const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema(
  {
    field: { type: String, required: true }, // e.g. 'status', 'priority'
    operator: { type: String, enum: ['equals', 'not_equals', 'contains'], required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { _id: false }
);

const actionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['send_notification', 'change_status', 'assign_user'],
      required: true
    },
    params: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const automationRuleSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    trigger: {
      type: {
        type: String,
        enum: ['status_change', 'task_assigned'],
        required: true
      },
      conditions: { type: [conditionSchema], default: [] } // empty = always matches
    },
    actions: {
      type: [actionSchema],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
