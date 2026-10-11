const TimeLog = require('../models/TimeLog');
const { AppError } = require('../middleware/errorHandler');
const { emitToProject } = require('../utils/socketService');

// ============================================
// START TIMER
// POST /api/tasks/:taskId/timer/start
// Auto-stops any OTHER timer this user has running — one active
// timer per user at a time (you can't be tracking two tasks at once).
// ============================================
exports.startTimer = async (req, res, next) => {
  try {
    const runningElsewhere = await TimeLog.findOne({ userId: req.user._id, endTime: null });
    if (runningElsewhere) {
      runningElsewhere.endTime = new Date();
      runningElsewhere.durationSeconds = Math.round(
        (runningElsewhere.endTime - runningElsewhere.startTime) / 1000
      );
      await runningElsewhere.save();
    }

    const timeLog = await TimeLog.create({
      taskId: req.task._id,
      userId: req.user._id,
      startTime: new Date()
    });

    emitToProject(req.task.projectId, 'timer:started', {
      taskId: req.task._id,
      userId: req.user._id,
      timeLog
    });

    res.status(201).json({ success: true, message: 'Timer started', timeLog });
  } catch (error) {
    next(error);
  }
};

// ============================================
// STOP TIMER
// POST /api/tasks/:taskId/timer/stop
// ============================================
exports.stopTimer = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findOne({
      taskId: req.task._id,
      userId: req.user._id,
      endTime: null
    });

    if (!timeLog) {
      return next(new AppError('No running timer found for this task', 404));
    }

    timeLog.endTime = new Date();
    timeLog.durationSeconds = Math.round((timeLog.endTime - timeLog.startTime) / 1000);
    await timeLog.save();

    emitToProject(req.task.projectId, 'timer:stopped', {
      taskId: req.task._id,
      userId: req.user._id,
      timeLog
    });

    res.status(200).json({ success: true, message: 'Timer stopped', timeLog });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET MY ACTIVE TIMER (for a persistent widget shown on any page)
// GET /api/timer/active
// ============================================
exports.getActiveTimer = async (req, res, next) => {
  try {
    const timeLog = await TimeLog.findOne({ userId: req.user._id, endTime: null }).populate(
      'taskId',
      'title projectId'
    );

    res.status(200).json({ success: true, timeLog: timeLog || null });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET TIME LOGS FOR A TASK
// GET /api/tasks/:taskId/time-logs
// ============================================
exports.getTaskTimeLogs = async (req, res, next) => {
  try {
    const logs = await TimeLog.find({ taskId: req.task._id, endTime: { $ne: null } })
      .populate('userId', 'name avatar')
      .sort({ startTime: -1 });

    const totalSeconds = logs.reduce((sum, l) => sum + l.durationSeconds, 0);

    res.status(200).json({ success: true, logs, totalSeconds });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE TASK ESTIMATE
// PATCH /api/tasks/:taskId/estimate
// Requires: requireTaskManagePermission (Owner/Admin OR task creator)
// ============================================
exports.updateEstimate = async (req, res, next) => {
  try {
    const { estimatedMinutes } = req.body;

    if (typeof estimatedMinutes !== 'number' || estimatedMinutes < 0) {
      return next(new AppError('estimatedMinutes must be a non-negative number', 400));
    }

    req.task.estimatedMinutes = estimatedMinutes;
    await req.task.save();

    res.status(200).json({ success: true, message: 'Estimate updated', task: req.task });
  } catch (error) {
    next(error);
  }
};

// ============================================
// MY TIMESHEET (own logged time within a date range)
// GET /api/timesheet?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// ============================================
exports.getMyTimesheet = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return next(new AppError('startDate and endDate query params are required', 400));
    }

   const endOfDay = new Date(endDate);
endOfDay.setHours(23, 59, 59, 999);

const logs = await TimeLog.find({
  userId: req.user._id,
  endTime: { $ne: null },
  startTime: { $gte: new Date(startDate), $lte: endOfDay }
})
      .populate('taskId', 'title')
      .sort({ startTime: 1 });

    const totalSeconds = logs.reduce((sum, l) => sum + l.durationSeconds, 0);

    res.status(200).json({ success: true, logs, totalSeconds });
  } catch (error) {
    next(error);
  }
};
