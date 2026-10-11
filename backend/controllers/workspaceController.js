const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { createNotification } = require('../utils/notificationService');

// ============================================
// CREATE WORKSPACE
// POST /api/workspaces
// ============================================
exports.createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length < 2) {
      return next(new AppError('Workspace name must be at least 2 characters', 400));
    }

    const workspace = new Workspace({
      name: name.trim(),
      description: description ? description.trim() : '',
      ownerId: req.user._id,
      members: [
        {
          userId: req.user._id,
          role: 'Owner'
        }
      ]
    });

    await workspace.save();

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      workspace
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET ALL WORKSPACES FOR LOGGED-IN USER
// GET /api/workspaces
// ============================================
exports.getMyWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      'members.userId': req.user._id,
      isArchived: false
    }).sort({ createdAt: -1 });

    // Attach the requesting user's role in each workspace (convenience for frontend)
    const workspacesWithRole = workspaces.map((ws) => {
      const memberEntry = ws.members.find(
        (m) => m.userId.toString() === req.user._id.toString()
      );
      return {
        ...ws.toObject(),
        myRole: memberEntry ? memberEntry.role : null
      };
    });

    res.status(200).json({
      success: true,
      count: workspacesWithRole.length,
      workspaces: workspacesWithRole
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET SINGLE WORKSPACE BY ID
// GET /api/workspaces/:workspaceId
// (checkWorkspaceMembership middleware already ran -> req.workspace available)
// ============================================
exports.getWorkspaceById = async (req, res, next) => {
  try {
    // req.workspace was already fetched + membership-verified by middleware
    const workspace = await Workspace.findById(req.workspace._id).populate(
      'members.userId',
      'name email avatar'
    );

    res.status(200).json({
      success: true,
      workspace,
      myRole: req.workspaceRole
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE WORKSPACE (name/description)
// PATCH /api/workspaces/:workspaceId
// ============================================
exports.updateWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const workspace = req.workspace;

    if (name !== undefined) {
      if (name.trim().length < 2) {
        return next(new AppError('Workspace name must be at least 2 characters', 400));
      }
      workspace.name = name.trim();
    }

    if (description !== undefined) {
      workspace.description = description.trim();
    }

    await workspace.save();

    res.status(200).json({
      success: true,
      message: 'Workspace updated',
      workspace
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// INVITE MEMBER TO WORKSPACE
// POST /api/workspaces/:workspaceId/invite
// Requires: requireRole('Owner', 'Admin') middleware before this
// ============================================
exports.inviteMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const workspace = req.workspace;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const allowedInviteRoles = ['Admin', 'Member', 'Guest'];
    const inviteRole = allowedInviteRoles.includes(role) ? role : 'Member';

    // Admins cannot invite someone as Owner (only existing Owners promote later, not via invite)
    if (role === 'Owner') {
      return next(new AppError('Cannot invite a member directly as Owner', 400));
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // Check if already a member
      const alreadyMember = workspace.members.some(
        (m) => m.userId.toString() === existingUser._id.toString()
      );
      if (alreadyMember) {
        return next(new AppError('User is already a member of this workspace', 409));
      }

      workspace.members.push({
        userId: existingUser._id,
        role: inviteRole
      });
      await workspace.save();

      await createNotification({
        userId: existingUser._id,
        type: 'invite',
        message: `${req.user.name} added you to "${workspace.name}" as ${inviteRole}`,
        entityType: 'Workspace',
        entityId: workspace._id,
        link: `/workspaces/${workspace._id}`,
        triggeredBy: req.user._id
      });

      return res.status(200).json({
        success: true,
        message: `${existingUser.name} added to workspace`,
        directAdd: true
      });
    }

    // User not registered yet -> add to pendingInvites
    const alreadyInvited = workspace.pendingInvites.some(
      (inv) => inv.email === normalizedEmail
    );
    if (alreadyInvited) {
      return next(new AppError('This email has already been invited', 409));
    }

    workspace.pendingInvites.push({
      email: normalizedEmail,
      role: inviteRole,
      invitedBy: req.user._id
    });
    await workspace.save();

    // TODO: send invite email once we wire this into emailService.js

    res.status(200).json({
      success: true,
      message: `Invite sent to ${normalizedEmail}`,
      directAdd: false
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ACCEPT WORKSPACE INVITE
// POST /api/workspaces/:workspaceId/accept-invite
// ============================================
exports.acceptInvite = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { token } = req.body || {};
    const userEmail = req.user.email.toLowerCase().trim();
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    const invite = workspace.pendingInvites.find((inv) => {
      if (token) {
        return inv.token === token || inv.email === userEmail;
      }
      return inv.email === userEmail;
    });

    if (!invite) {
      return next(new AppError('No pending invite found for this user', 404));
    }

    const alreadyMember = workspace.members.some(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      workspace.pendingInvites = workspace.pendingInvites.filter(
        (inv) => inv.email !== userEmail
      );
      await workspace.save();
      return res.status(200).json({
        success: true,
        message: 'You are already a member of this workspace',
        alreadyMember: true
      });
    }

    workspace.members.push({
      userId: req.user._id,
      role: invite.role || 'Member'
    });

    workspace.pendingInvites = workspace.pendingInvites.filter(
      (inv) => inv.email !== userEmail
    );

    await workspace.save();

    await createNotification({
      userId: req.user._id,
      type: 'invite_accepted',
      message: `You joined "${workspace.name}"`,
      entityType: 'Workspace',
      entityId: workspace._id,
      link: `/workspaces/${workspace._id}`,
      triggeredBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Workspace invite accepted',
      workspace
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CHANGE MEMBER ROLE
// PATCH /api/workspaces/:workspaceId/members/:targetUserId
// Requires: requireRole('Owner') + preventLastOwnerDemotion middleware before this
// ============================================
exports.changeUserRole = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { newRole } = req.body;
    const workspace = req.workspace;

    const validRoles = ['Owner', 'Admin', 'Member', 'Guest'];
    if (!validRoles.includes(newRole)) {
      return next(new AppError('Invalid role specified', 400));
    }

    const memberEntry = workspace.members.find(
      (m) => m.userId.toString() === targetUserId
    );

    if (!memberEntry) {
      return next(new AppError('Member not found in this workspace', 404));
    }

    memberEntry.role = newRole;
    await workspace.save();

    res.status(200).json({
      success: true,
      message: 'Member role updated',
      member: memberEntry
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REMOVE MEMBER FROM WORKSPACE
// DELETE /api/workspaces/:workspaceId/members/:targetUserId
// Requires: requireRole('Owner', 'Admin') middleware before this
// ============================================
exports.removeMember = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const workspace = req.workspace;

    const targetMember = workspace.members.find(
      (m) => m.userId.toString() === targetUserId
    );

    if (!targetMember) {
      return next(new AppError('Member not found in this workspace', 404));
    }

    // Prevent removing the last Owner
    if (targetMember.role === 'Owner') {
      const ownerCount = workspace.members.filter((m) => m.role === 'Owner').length;
      if (ownerCount <= 1) {
        return next(new AppError('Cannot remove the last remaining Owner', 400));
      }
    }

    workspace.members = workspace.members.filter(
      (m) => m.userId.toString() !== targetUserId
    );

    await workspace.save();

    res.status(200).json({
      success: true,
      message: 'Member removed from workspace'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ARCHIVE WORKSPACE (soft delete)
// DELETE /api/workspaces/:workspaceId
// Requires: requireRole('Owner') middleware before this
// ============================================
exports.archiveWorkspace = async (req, res, next) => {
  try {
    const workspace = req.workspace;
    workspace.isArchived = true;
    await workspace.save();

    res.status(200).json({
      success: true,
      message: 'Workspace archived'
    });
  } catch (error) {
    next(error);
  }
};
