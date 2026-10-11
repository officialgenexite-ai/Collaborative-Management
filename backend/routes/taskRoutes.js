const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/workspaceRoleMiddleware');
const { checkProjectMembership } = require('../middleware/projectAccessMiddleware');
const {
  loadTaskAndCheckAccess,
  requireTaskManagePermission,
  requireStatusUpdatePermission
} = require('../middleware/taskAccessMiddleware');

const {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  assignTask,
  reorderTask,
  deleteTask
} = require('../controllers/taskController');

// ============================================
// PROJECT-SCOPED (create + list within a project)
// ============================================

// Create a task (Owner/Admin/Member — Guests cannot create)
router.post(
  '/projects/:projectId/tasks',
  protect,
  checkProjectMembership,
  requireRole('Owner', 'Admin', 'Member'),
  createTask
);

// List tasks in a project (any role with project access)
router.get(
  '/projects/:projectId/tasks',
  protect,
  checkProjectMembership,
  getProjectTasks
);

// ============================================
// TASK-SCOPED (single task actions)
// ============================================

router.get('/tasks/:taskId', protect, loadTaskAndCheckAccess, getTaskById);

// Full edit (Owner/Admin OR the task's creator)
router.patch(
  '/tasks/:taskId',
  protect,
  loadTaskAndCheckAccess,
  requireTaskManagePermission,
  updateTask
);

// Status change only (Owner/Admin OR an assignee)
router.patch(
  '/tasks/:taskId/status',
  protect,
  loadTaskAndCheckAccess,
  requireStatusUpdatePermission,
  updateTaskStatus
);

// Reassign task (Owner/Admin/Member — Guests cannot reassign)
router.patch(
  '/tasks/:taskId/assign',
  protect,
  loadTaskAndCheckAccess,
  requireRole('Owner', 'Admin', 'Member'),
  assignTask
);

// Reorder within List/Board view (anyone with project access)
router.patch(
  '/tasks/:taskId/reorder',
  protect,
  loadTaskAndCheckAccess,
  reorderTask
);

// Delete/archive (Owner/Admin OR the task's creator)
router.delete(
  '/tasks/:taskId',
  protect,
  loadTaskAndCheckAccess,
  requireTaskManagePermission,
  deleteTask
);

module.exports = router;
