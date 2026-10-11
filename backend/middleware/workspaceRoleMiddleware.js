const { AppError } = require('./errorHandler');
const Workspace = require('../models/Workspace');

// Role hierarchy — higher number = more permissions
const ROLE_LEVELS = {
  Guest: 1,
  Member: 2,
  Admin: 3,
  Owner: 4
};

/**
 * checkWorkspaceMembership
 * ------------------------
 * 1. Reads workspaceId from req.params (expects route like /workspaces/:workspaceId/...)
 * 2. Finds the workspace, checks if req.user is in its members[] array
 * 3. If member found -> attaches req.workspaceRole + req.workspace to the request
 * 4. If not a member -> blocks with 403
 *
 * Must run AFTER `protect` middleware (needs req.user already set)
 */
const checkWorkspaceMembership = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId) {
      return next(new AppError('Workspace ID missing in route', 400));
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return next(new AppError('Workspace not found', 404));
    }

    const memberEntry = workspace.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );

    if (!memberEntry) {
      return next(new AppError('You are not a member of this workspace', 403));
    }

    // Attach for downstream use (route handlers + requireRole)
    req.workspace = workspace;
    req.workspaceRole = memberEntry.role;

    return next();
  } catch (error) {
    next(error);
  }
};

/**
 * requireRole(...allowedRoles)
 * -----------------------------
 * Factory function — returns middleware that checks if req.workspaceRole
 * is included in the allowedRoles list.
 *
 * Must run AFTER checkWorkspaceMembership (needs req.workspaceRole set)
 *
 * Usage: router.post('/:workspaceId/invite', protect, checkWorkspaceMembership, requireRole('Owner', 'Admin'), inviteController)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.workspaceRole) {
      return next(new AppError('Workspace role not resolved. Did you run checkWorkspaceMembership first?', 500));
    }

    if (!allowedRoles.includes(req.workspaceRole)) {
      return next(
        new AppError(
          `Access denied. Requires one of: ${allowedRoles.join(', ')}. Your role: ${req.workspaceRole}`,
          403
        )
      );
    }

    return next();
  };
};

/**
 * requireMinLevel(minRole)
 * -------------------------
 * Alternative to requireRole — checks role HIERARCHY instead of exact list.
 * e.g. requireMinLevel('Admin') allows Admin AND Owner (since Owner > Admin),
 * but blocks Member and Guest.
 *
 * Useful when permission logic is "this role or higher" rather than a fixed set.
 */
const requireMinLevel = (minRole) => {
  return (req, res, next) => {
    if (!req.workspaceRole) {
      return next(new AppError('Workspace role not resolved. Did you run checkWorkspaceMembership first?', 500));
    }

    const userLevel = ROLE_LEVELS[req.workspaceRole];
    const requiredLevel = ROLE_LEVELS[minRole];

    if (!requiredLevel) {
      return next(new AppError(`Invalid role specified in requireMinLevel: ${minRole}`, 500));
    }

    if (userLevel < requiredLevel) {
      return next(
        new AppError(`Access denied. Requires ${minRole} level or higher. Your role: ${req.workspaceRole}`, 403)
      );
    }

    return next();
  };
};

/**
 * preventLastOwnerDemotion
 * --------------------------
 * Business rule guard: a workspace must always have at least 1 Owner.
 * Used specifically on the "change member role" route, BEFORE the update happens.
 * Expects req.workspace already attached (from checkWorkspaceMembership)
 * and req.params.targetUserId + req.body.newRole to check against.
 */
const preventLastOwnerDemotion = (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { newRole } = req.body;

    const targetMember = req.workspace.members.find(
      (m) => m.userId.toString() === targetUserId
    );

    if (!targetMember) {
      return next(new AppError('Target member not found in this workspace', 404));
    }

    if (targetMember.role === 'Owner' && newRole !== 'Owner') {
      const ownerCount = req.workspace.members.filter((m) => m.role === 'Owner').length;
      if (ownerCount <= 1) {
        return next(new AppError('Cannot demote the last remaining Owner of a workspace', 400));
      }
    }

    return next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkWorkspaceMembership,
  requireRole,
  requireMinLevel,
  preventLastOwnerDemotion,
  ROLE_LEVELS
};
