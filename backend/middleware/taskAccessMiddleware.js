const { AppError } = require('./errorHandler');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Workspace = require('../models/Workspace');

/**
 * loadTaskAndCheckAccess
 * ------------------------
 * For routes shaped like /tasks/:taskId/...
 *
 * ALGORITHM:
 * 1. Load the task by :taskId (must exist and not be archived)
 * 2. Load its parent project, then parent workspace
 * 3. Apply the SAME project-access rule as checkProjectMembership
 *    (Owner/Admin always in; Member in if project is open or explicitly listed;
 *     Guest only if explicitly listed)
 * 4. Attach req.task, req.project, req.workspace, req.workspaceRole
 * 5. Also attach req.isAssignee and req.isCreator — used by the
 *    fine-grained permission checks below (task actions aren't purely
 *    role-based; "who created it" and "who it's assigned to" matter too)
 */
const loadTaskAndCheckAccess = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task || task.isArchived) {
      return next(new AppError('Task not found', 404));
    }

    const project = await Project.findById(task.projectId);
    if (!project || project.isArchived) {
      return next(new AppError('Parent project not found', 404));
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

    const userId = req.user._id.toString();

    req.task = task;
    req.project = project;
    req.workspace = workspace;
    req.workspaceRole = workspaceRole;
    req.isAssignee = task.assignees.some((a) => a.toString() === userId);
    req.isCreator = task.createdBy.toString() === userId;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * requireTaskManagePermission
 * -----------------------------
 * For full edit / delete: Owner/Admin OR the task's original creator.
 * Must run AFTER loadTaskAndCheckAccess.
 */
const requireTaskManagePermission = (req, res, next) => {
  const isOwnerOrAdmin = req.workspaceRole === 'Owner' || req.workspaceRole === 'Admin';
  if (!isOwnerOrAdmin && !req.isCreator) {
    return next(new AppError('Only the task creator or a workspace Admin/Owner can perform this action', 403));
  }
  next();
};

/**
 * requireStatusUpdatePermission
 * --------------------------------
 * For status changes only: Owner/Admin OR an assignee of the task.
 * (Deliberately more permissive than full edit — an assignee should be able
 * to move their own task through the workflow without needing edit rights.)
 * Must run AFTER loadTaskAndCheckAccess.
 */
const requireStatusUpdatePermission = (req, res, next) => {
  const isOwnerOrAdmin = req.workspaceRole === 'Owner' || req.workspaceRole === 'Admin';
  if (!isOwnerOrAdmin && !req.isAssignee) {
    return next(new AppError('Only an assignee or a workspace Admin/Owner can update the task status', 403));
  }
  next();
};

module.exports = {
  loadTaskAndCheckAccess,
  requireTaskManagePermission,
  requireStatusUpdatePermission
};
