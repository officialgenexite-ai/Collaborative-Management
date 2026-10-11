const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { checkProjectMembership } = require('../middleware/projectAccessMiddleware');
const { requireRole } = require('../middleware/workspaceRoleMiddleware');

const { reindexProject, askKnowledgeBase } = require('../controllers/ragController');

router.post(
  '/projects/:projectId/knowledge/reindex',
  protect,
  checkProjectMembership,
  requireRole('Owner', 'Admin'),
  reindexProject
);

router.post('/projects/:projectId/ai/ask', protect, checkProjectMembership, askKnowledgeBase);

module.exports = router;
