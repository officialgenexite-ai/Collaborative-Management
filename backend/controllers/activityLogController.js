const ActivityLog = require('../models/ActivityLog');

// ============================================
// GET ACTIVITY FOR A SINGLE TASK
// GET /api/tasks/:taskId/activity
// ============================================
exports.getTaskActivity = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({ entityType: 'Task', entityId: req.task._id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: logs.length, activity: logs });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET ACTIVITY FOR A WHOLE PROJECT (project changes + every task's changes)
// GET /api/projects/:projectId/activity
// ============================================
exports.getProjectActivity = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find({ projectId: req.project._id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, count: logs.length, activity: logs });
  } catch (error) {
    next(error);
  }
};
