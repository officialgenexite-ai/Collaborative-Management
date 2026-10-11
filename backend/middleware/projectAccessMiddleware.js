const { AppError } = require('./errorHandler');
const Project = require('../models/Project');
const Workspace = require('../models/Workspace');

/**
 * checkProjectMembership
 * ------------------------
 * For routes shaped like /projects/:projectId/...
 *
 * ALGORITHM:
 * 1. Load the project by :projectId (must exist and not be archived)
 * 2. Load its parent workspace, confirm req.user is a member of that workspace
 * 3. Determine project-level access using this rule:
 *    - workspaceRole Owner/Admin -> always has access (management access)
 *    - workspaceRole Member      -> has access if project.members is EMPTY (open project)
 *                                    OR user is explicitly listed in project.members
 *    - workspaceRole Guest       -> has access ONLY if explicitly listed in project.members
 * 4. Attach req.project, req.workspace, req.workspaceRole for downstream use
 *
 * Must run AFTER `protect` (needs req.user).
 * Combine with requireRole('Owner','Admin') from workspaceRoleMiddleware for
 * management-only actions (edit/archive/add-remove members) — req.workspaceRole
 * set here is exactly what requireRole reads.
 */
const checkProjectMembership = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project || project.isArchived) {
      return next(new AppError('Project not found', 404));
    }

    const workspace = await Workspace.findById(project.workspaceId);
    if (!workspace) {
      return next(new AppError('Parent workspace not found', 404));
    }

    const memberEntry = workspace.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );

    if (!memberEntry) {
      return next(new AppError('You are not a member of this workspace', 403));
    }

    const workspaceRole = memberEntry.role;
    const isExplicitProjectMember = project.members.some(
      (m) => m.userId.toString() === req.user._id.toString()
    );

    let hasProjectAccess = false;
    if (workspaceRole === 'Owner' || workspaceRole === 'Admin') {
      hasProjectAccess = true;
    } else if (workspaceRole === 'Member') {
      hasProjectAccess = project.members.length === 0 || isExplicitProjectMember;
    } else if (workspaceRole === 'Guest') {
      hasProjectAccess = isExplicitProjectMember;
    }

    if (!hasProjectAccess) {
      return next(new AppError('You do not have access to this project', 403));
    }

    req.project = project;
    req.workspace = workspace;
    req.workspaceRole = workspaceRole;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkProjectMembership };
