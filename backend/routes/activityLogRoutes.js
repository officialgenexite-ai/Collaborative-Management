const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { loadTaskAndCheckAccess } = require('../middleware/taskAccessMiddleware');
const { checkProjectMembership } = require('../middleware/projectAccessMiddleware');
const { getTaskActivity, getProjectActivity } = require('../controllers/activityLogController');

router.get('/tasks/:taskId/activity', protect, loadTaskAndCheckAccess, getTaskActivity);
router.get('/projects/:projectId/activity', protect, checkProjectMembership, getProjectActivity);

module.exports = router;
