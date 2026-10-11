const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  checkWorkspaceMembership,
  requireRole,
  preventLastOwnerDemotion
} = require('../middleware/workspaceRoleMiddleware');

const {
  createWorkspace,
  getMyWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  inviteMember,
  acceptInvite,
  changeUserRole,
  removeMember,
  archiveWorkspace
} = require('../controllers/workspaceController');

// ============================================
// All routes below require a valid JWT (protect)
// ============================================

// Create a new workspace
router.post('/', protect, createWorkspace);

// Get all workspaces the logged-in user belongs to
router.get('/', protect, getMyWorkspaces);

// Get single workspace details (must be a member)
router.get(
  '/:workspaceId',
  protect,
  checkWorkspaceMembership,
  getWorkspaceById
);

// Update workspace name/description (Admin or Owner)
router.patch(
  '/:workspaceId',
  protect,
  checkWorkspaceMembership,
  requireRole('Owner', 'Admin'),
  updateWorkspace
);

// Archive (soft-delete) workspace (Owner only)
router.delete(
  '/:workspaceId',
  protect,
  checkWorkspaceMembership,
  requireRole('Owner'),
  archiveWorkspace
);

// Invite a member (Admin or Owner)
router.post(
  '/:workspaceId/invite',
  protect,
  checkWorkspaceMembership,
  requireRole('Owner', 'Admin'),
  inviteMember
);

// Accept a workspace invite (logged-in user)
router.post(
  '/:workspaceId/accept-invite',
  protect,
  acceptInvite
);

// Change a member's role (Owner only) — guarded against demoting last Owner
router.patch(
  '/:workspaceId/members/:targetUserId',
  protect,
  checkWorkspaceMembership,
  requireRole('Owner'),
  preventLastOwnerDemotion,
  changeUserRole
);

// Remove a member from workspace (Admin or Owner)
router.delete(
  '/:workspaceId/members/:targetUserId',
  protect,
  checkWorkspaceMembership,
  requireRole('Owner', 'Admin'),
  removeMember
);

module.exports = router;
