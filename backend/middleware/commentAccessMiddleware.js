const { AppError } = require('./errorHandler');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Workspace = require('../models/Workspace');

/**
 * loadCommentAndCheckAccess
 * ---------------------------
 * For routes shaped like /comments/:commentId/...
 * Same access-resolution chain as loadTaskAndCheckAccess (task -> project ->
 * workspace), starting one level higher from the comment. Attaches
 * req.comment, req.task, req.project, req.workspace, req.workspaceRole,
 * and req.isCommentAuthor.
 */
const loadCommentAndCheckAccess = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return next(new AppError('Comment not found', 404));
    }

    const task = await Task.findById(comment.taskId);
    if (!task || task.isArchived) {
      return next(new AppError('Parent task not found', 404));
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

    req.comment = comment;
    req.task = task;
    req.project = project;
    req.workspace = workspace;
    req.workspaceRole = workspaceRole;
    req.isCommentAuthor = comment.userId.toString() === req.user._id.toString();

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * requireCommentAuthorOrManage
 * -------------------------------
 * For deletion: the comment's author OR a workspace Owner/Admin (moderation).
 * NOTE: editing text is intentionally NOT covered by this — only the
 * author can edit their own words (see updateComment in the controller,
 * which checks req.isCommentAuthor directly rather than using this).
 */
const requireCommentAuthorOrManage = (req, res, next) => {
  const isOwnerOrAdmin = req.workspaceRole === 'Owner' || req.workspaceRole === 'Admin';
  if (!isOwnerOrAdmin && !req.isCommentAuthor) {
    return next(new AppError('Only the comment author or a workspace Admin/Owner can perform this action', 403));
  }
  next();
};

module.exports = { loadCommentAndCheckAccess, requireCommentAuthorOrManage };
