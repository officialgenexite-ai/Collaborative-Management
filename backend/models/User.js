const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,

  // Password reset support (not in old code, added for completeness)
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  // Global platform role (NOT workspace role — workspace role lives in Workspace.members[])
  // Kept for system-level distinction only (e.g. super-admin of the platform itself, rare use case)
  role: {
    type: String,
    enum: ['Owner', 'Admin', 'Member', 'Guest'],
    default: 'Member'
  },

  lastLogin: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);
