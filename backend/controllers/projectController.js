const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/activityLogService');

// ============================================
// CREATE PROJECT (within a workspace)
// POST /api/workspaces/:workspaceId/projects
// Requires: requireRole('Owner', 'Admin')
// ============================================
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    if (!name || name.trim().length < 2) {
      return next(new AppError('Project name must be at least 2 characters', 400));
    }

    const project = new Project({
      workspaceId: req.workspace._id,
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || undefined,
      createdBy: req.user._id,
      members: [] // empty by default -> open to all workspace Members; Guests added explicitly later
    });

    await project.save();

    // Activity Log added here
    logActivity({
      entityType: 'Project',
      entityId: project._id,
      projectId: project._id,
      action: 'project_created',
      userId: req.user._id,
      meta: { name: project.name }
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LIST PROJECTS IN A WORKSPACE (access-filtered)
// GET /api/workspaces/:workspaceId/projects
// Requires: checkWorkspaceMembership only (any role) — visibility is filtered per-role below
// ============================================
exports.getWorkspaceProjects = async (req, res, next) => {
  try {
    const allProjects = await Project.find({
      workspaceId: req.workspace._id,
      isArchived: false
    }).sort({ createdAt: -1 });

    const role = req.workspaceRole;
    const userId = req.user._id.toString();

    // Same access rule as checkProjectMembership — kept in sync intentionally
    const visibleProjects = allProjects.filter((p) => {
      if (role === 'Owner' || role === 'Admin') return true;
      const isExplicitMember = p.members.some((m) => m.userId.toString() === userId);
      if (role === 'Member') return p.members.length === 0 || isExplicitMember;
      if (role === 'Guest') return isExplicitMember;
      return false;
    });

    res.status(200).json({
      success: true,
      count: visibleProjects.length,
      projects: visibleProjects
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET SINGLE PROJECT
// GET /api/projects/:projectId
// (checkProjectMembership already ran -> req.project available)
// ============================================
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.project._id).populate(
      'members.userId',
      'name email avatar'
    );

    res.status(200).json({
      success: true,
      project,
      myWorkspaceRole: req.workspaceRole
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE PROJECT
// PATCH /api/projects/:projectId
// Requires: requireRole('Owner', 'Admin')
// ============================================
exports.updateProject = async (req, res, next) => {
  try {
    const { name, description, status, color } = req.body;
    const project = req.project;

    if (name !== undefined) {
      if (name.trim().length < 2) {
        return next(new AppError('Project name must be at least 2 characters', 400));
      }
      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description = description.trim();
    }

    if (status !== undefined) {
      if (!['Active', 'Completed', 'Archived'].includes(status)) {
        return next(new AppError('Invalid status value', 400));
      }
      project.status = status;
    }

    if (color !== undefined) {
      project.color = color;
    }

    await project.save();

    // Activity Log added here
    logActivity({
      entityType: 'Project',
      entityId: project._id,
      projectId: project._id,
      action: 'project_updated',
      userId: req.user._id,
      meta: { fields: Object.keys(req.body) }
    });

    res.status(200).json({
      success: true,
      message: 'Project updated',
      project
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ARCHIVE PROJECT (soft delete)
// DELETE /api/projects/:projectId
// Requires: requireRole('Owner', 'Admin')
// ============================================
exports.archiveProject = async (req, res, next) => {
  try {
    req.project.isArchived = true;
    await req.project.save();

    // Activity Log added here
    logActivity({
      entityType: 'Project',
      entityId: req.project._id,
      projectId: req.project._id,
      action: 'project_archived',
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Project archived'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ADD MEMBER TO PROJECT (scoped access, mainly for Guests)
// POST /api/projects/:projectId/members
// Requires: requireRole('Owner', 'Admin')
// ============================================
exports.addProjectMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = req.project;

    if (!userId) {
      return next(new AppError('userId is required', 400));
    }

    // Must already be a member of the parent workspace
    const isWorkspaceMember = req.workspace.members.some(
      (m) => m.userId.toString() === userId
    );
    if (!isWorkspaceMember) {
      return next(new AppError('User must be a member of the workspace before being added to a project', 400));
    }

    const alreadyInProject = project.members.some((m) => m.userId.toString() === userId);
    if (alreadyInProject) {
      return next(new AppError('User is already in this project', 409));
    }

    project.members.push({ userId });
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Member added to project',
      project
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REMOVE MEMBER FROM PROJECT
// DELETE /api/projects/:projectId/members/:targetUserId
// Requires: requireRole('Owner', 'Admin')
// ============================================
exports.removeProjectMember = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const project = req.project;

    project.members = project.members.filter(
      (m) => m.userId.toString() !== targetUserId
    );

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Member removed from project'
    });
  } catch (error) {
    next(error);
  }
};
