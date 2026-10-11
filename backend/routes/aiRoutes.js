const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { checkProjectMembership } = require('../middleware/projectAccessMiddleware');
const { requireRole } = require('../middleware/workspaceRoleMiddleware');
const { loadTaskAndCheckAccess } = require('../middleware/taskAccessMiddleware');
const aiMediaUpload = require('../models/aiMediaUpload');

const {
  processCommand,
  processVoiceCommand,
  processImageCommand,
  getConversation,
  clearConversation,
  getTaskSummary
} = require('../controllers/aiController');

// Guests excluded — same permission level as task creation
router.post(
  '/projects/:projectId/ai/command',
  protect,
  checkProjectMembership,
  requireRole('Owner', 'Admin', 'Member'),
  processCommand
);

router.post(
  '/projects/:projectId/ai/voice-command',
  protect,
  checkProjectMembership,
  requireRole('Owner', 'Admin', 'Member'),
  aiMediaUpload.single('audio'),
  processVoiceCommand
);
router.post(
  '/projects/:projectId/ai/image-command',
  protect,
  checkProjectMembership,
  requireRole('Owner', 'Admin', 'Member'),
  aiMediaUpload.single('image'),
  processImageCommand
);

router.get('/projects/:projectId/ai/conversation', protect, checkProjectMembership, getConversation);
router.delete('/projects/:projectId/ai/conversation', protect, checkProjectMembership, clearConversation);

router.get('/tasks/:taskId/summary', protect, loadTaskAndCheckAccess, getTaskSummary);

module.exports = router;
