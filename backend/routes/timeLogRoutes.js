const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { loadTaskAndCheckAccess, requireTaskManagePermission } = require('../middleware/taskAccessMiddleware');

const {
  startTimer,
  stopTimer,
  getActiveTimer,
  getTaskTimeLogs,
  updateEstimate,
  getMyTimesheet
} = require('../controllers/timeLogController');

router.get('/timer/active', protect, getActiveTimer);
router.get('/timesheet', protect, getMyTimesheet);

router.post('/tasks/:taskId/timer/start', protect, loadTaskAndCheckAccess, startTimer);
router.post('/tasks/:taskId/timer/stop', protect, loadTaskAndCheckAccess, stopTimer);
router.get('/tasks/:taskId/time-logs', protect, loadTaskAndCheckAccess, getTaskTimeLogs);
router.patch(
  '/tasks/:taskId/estimate',
  protect,
  loadTaskAndCheckAccess,
  requireTaskManagePermission,
  updateEstimate
);

module.exports = router;
