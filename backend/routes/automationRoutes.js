const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/workspaceRoleMiddleware');
const { checkProjectMembership: checkProjectAccess } = require('../middleware/projectAccessMiddleware');

const {
  createRule,
  getProjectRules,
  toggleRule,
  updateRule,
  deleteRule
} = require('../controllers/automationController');

// Automations affect the whole project's workflow — Owner/Admin only
router.post(
  '/projects/:projectId/automations',
  protect,
  checkProjectAccess,
  requireRole('Owner', 'Admin'),
  createRule
);
router.get(
  '/projects/:projectId/automations',
  protect,
  checkProjectAccess,
  requireRole('Owner', 'Admin'),
  getProjectRules
);
router.patch(
  '/projects/:projectId/automations/:ruleId/toggle',
  protect,
  checkProjectAccess,
  requireRole('Owner', 'Admin'),
  toggleRule
);
router.patch(
  '/projects/:projectId/automations/:ruleId',
  protect,
  checkProjectAccess,
  requireRole('Owner', 'Admin'),
  updateRule
);
router.delete(
  '/projects/:projectId/automations/:ruleId',
  protect,
  checkProjectAccess,
  requireRole('Owner', 'Admin'),
  deleteRule
);

module.exports = router;
