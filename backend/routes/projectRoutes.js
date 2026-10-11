const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { checkWorkspaceMembership, requireRole } = require('../middleware/workspaceRoleMiddleware');
const { checkProjectMembership } = require('../middleware/projectAccessMiddleware');

const {
  createProject,
  getWorkspaceProjects,
  getProjectById,
  updateProject,
  archiveProject,
  addProjectMember,
  removeProjectMember
} = require('../controllers/projectController');

// ============================================
// WORKSPACE-SCOPED (create + list within a workspace)
// ============================================

// Create a new project inside a workspace (Admin or Owner)
router.post(
  '/workspaces/:workspaceId/projects',
  protect,
  checkWorkspaceMembership,
  requireRole('Owner', 'Admin'),
  createProject
);

// List projects visible to the current user in this workspace (any role — filtered internally)
router.get(
  '/workspaces/:workspaceId/projects',
  protect,
  checkWorkspaceMembership,
  getWorkspaceProjects
);

// ============================================
// PROJECT-SCOPED (single project actions)
// ============================================

// Get single project details (must have project access)
router.get(
  '/projects/:projectId',
  protect,
  checkProjectMembership,
  getProjectById
);

// Update project name/description/status/color (Admin or Owner)
router.patch(
  '/projects/:projectId',
  protect,
  checkProjectMembership,
  requireRole('Owner', 'Admin'),
  updateProject
);

// Archive project (Admin or Owner)
router.delete(
  '/projects/:projectId',
  protect,
  checkProjectMembership,
  requireRole('Owner', 'Admin'),
  archiveProject
);

// Add a member to project scope — mainly for Guests who need explicit access (Admin or Owner)
router.post(
  '/projects/:projectId/members',
  protect,
  checkProjectMembership,
  requireRole('Owner', 'Admin'),
  addProjectMember
);

// Remove a member from project scope (Admin or Owner)
router.delete(
  '/projects/:projectId/members/:targetUserId',
  protect,
  checkProjectMembership,
  requireRole('Owner', 'Admin'),
  removeProjectMember
);

module.exports = router;
