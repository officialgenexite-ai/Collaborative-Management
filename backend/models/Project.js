const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Archived'],
      default: 'Active'
    },
    color: {
      type: String,
      default: '#4f46e5' // used for project chips/badges in the UI
    },
    // Empty array = open to all workspace Members (Owner/Admin always have access regardless).
    // Guests ALWAYS require an explicit entry here — enforced in checkProjectMembership.
    members: {
      type: [projectMemberSchema],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

projectSchema.index({ workspaceId: 1, isArchived: 1 });

module.exports = mongoose.model('Project', projectSchema);
