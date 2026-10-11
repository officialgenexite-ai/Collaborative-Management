const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['Owner', 'Admin', 'Member', 'Guest'],
      default: 'Member',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false } // no separate _id needed for each member sub-document
);

const workspaceSchema = new mongoose.Schema(
  {
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
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: {
      type: [memberSchema],
      default: [],
      validate: {
        validator: function (members) {
          // Must always have exactly one active Owner at minimum
          return members.some((m) => m.role === 'Owner');
        },
        message: 'Workspace must have at least one Owner'
      }
    },
    // Pending invites for emails not yet registered on the platform
    pendingInvites: [
      {
        email: { type: String, lowercase: true, trim: true },
        role: {
          type: String,
          enum: ['Admin', 'Member', 'Guest'],
          default: 'Member'
        },
        invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        invitedAt: { type: Date, default: Date.now },
        token: { type: String },
        expiresAt: {
          type: Date,
          default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    ],
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
);

// Index for fast lookup of workspaces a user belongs to
workspaceSchema.index({ 'members.userId': 1 });

module.exports = mongoose.model('Workspace', workspaceSchema);
