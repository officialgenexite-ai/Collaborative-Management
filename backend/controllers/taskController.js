const Task = require('../models/Task');
const { AppError } = require('../middleware/errorHandler');
const { emitToProject } = require('../utils/socketService');
const { createNotifications } = require('../utils/notificationService');
const { logActivity } = require('../utils/activityLogService');
const { runAutomations } = require('../models/automationEngine');
const { upsertChunk } = require('../utils/embeddingService');
const { analyzeSentiment } = require('../utils/aiService');

const STATUS_VALUES = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITY_VALUES = ['Low', 'Medium', 'High', 'Urgent'];

// ============================================
// CREATE TASK
// POST /api/projects/:projectId/tasks
// Requires: checkProjectMembership + requireRole('Owner','Admin','Member')
// ============================================
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, assignees, dueDate, priority, parentTaskId, tags } = req.body;

    if (!title || !title.trim()) {
      return next(new AppError('Task title is required', 400));
    }

    // If the project has an explicit (closed) member list, assignees must be within it.
    // Open projects (empty members[]) trust any assignee ID the client sends —
    // full cross-check against ALL workspace members happens implicitly via
    // the workspace's own membership rules, kept lightweight here for MVP.
    if (assignees && assignees.length > 0 && req.project.members.length > 0) {
      const projectMemberIds = req.project.members.map((m) => m.userId.toString());
      const invalidAssignee = assignees.find((a) => !projectMemberIds.includes(a));
      if (invalidAssignee) {
        return next(new AppError('All assignees must have access to this project', 400));
      }
    }

    if (parentTaskId) {
      const parentTask = await Task.findOne({ _id: parentTaskId, projectId: req.project._id });
      if (!parentTask) {
        return next(new AppError('Parent task not found in this project', 404));
      }
    }

    const lastTask = await Task.findOne({ projectId: req.project._id }).sort({ order: -1 });
    const nextOrder = lastTask ? lastTask.order + 1 : 0;

    const task = new Task({
      projectId: req.project._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      assignees: assignees || [],
      dueDate: dueDate || undefined,
      priority: PRIORITY_VALUES.includes(priority) ? priority : 'Medium',
      parentTaskId: parentTaskId || null,
      tags: tags || [],
      order: nextOrder,
      createdBy: req.user._id
    });

    await task.save();

    // TODO: fire 'task_created' event once the Automation Engine exists
    emitToProject(req.project._id, 'task:created', task);
    logActivity({
      entityType: 'Task',
      entityId: task._id,
      projectId: req.project._id,
      action: 'task_created',
      userId: req.user._id,
      meta: { title: task.title }
    });
    upsertChunk({
      projectId: req.project._id,
      sourceType: 'Task',
      sourceId: task._id,
      text: `${task.title}\n${task.description || ''}`
    }).catch((err) => console.error('[embedding] task create failed:', err.message)); // TEMP logging — remove once confirmed working

    analyzeSentiment(`${task.title}\n${task.description || ''}`)
      .then(async (sentiment) => {
        if (!sentiment) return;
        task.sentiment = sentiment;
        await task.save();
        emitToProject(req.project._id, 'task:updated', task);
      })
      .catch((err) => console.error('[sentiment] task analysis failed:', err.message));

    res.status(201).json({ success: true, message: 'Task created', task });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LIST TASKS IN A PROJECT
// GET /api/projects/:projectId/tasks
// Requires: checkProjectMembership (any role with project access)
// ============================================
exports.getProjectTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ projectId: req.project._id, isArchived: false })
      .populate('assignees', 'name email avatar')
      .sort({ order: 1 });

    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET SINGLE TASK
// GET /api/tasks/:taskId
// ============================================
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.task._id)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(200).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE TASK (full edit — title, description, priority, due date, tags)
// PATCH /api/tasks/:taskId
// Requires: requireTaskManagePermission (Owner/Admin OR creator)
// ============================================
exports.updateTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, tags } = req.body;
    const task = req.task;

    if (title !== undefined) {
      if (!title.trim()) return next(new AppError('Task title cannot be empty', 400));
      task.title = title.trim();
    }
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) {
      if (!PRIORITY_VALUES.includes(priority)) return next(new AppError('Invalid priority value', 400));
      task.priority = priority;
    }
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;

    await task.save();

    emitToProject(task.projectId, 'task:updated', task);
    logActivity({
      entityType: 'Task',
      entityId: task._id,
      projectId: task.projectId,
      action: 'task_updated',
      userId: req.user._id,
      meta: { fields: Object.keys(req.body) }
    });
    upsertChunk({
      projectId: task.projectId,
      sourceType: 'Task',
      sourceId: task._id,
      text: `${task.title}\n${task.description || ''}`
    }).catch((err) => console.error('[embedding] task update failed:', err.message)); // TEMP logging

    res.status(200).json({ success: true, message: 'Task updated', task });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE TASK STATUS
// PATCH /api/tasks/:taskId/status
// Requires: requireStatusUpdatePermission (assignee OR Owner/Admin)
// ============================================
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!STATUS_VALUES.includes(status)) {
      return next(new AppError('Invalid status value', 400));
    }

    const previousStatus = req.task.status;
    req.task.status = status;
    await req.task.save();

    // TODO: fire 'status_change' event once the Automation Engine exists
    emitToProject(req.task.projectId, 'task:updated', req.task);
    logActivity({
      entityType: 'Task',
      entityId: req.task._id,
      projectId: req.task.projectId,
      action: 'status_changed',
      userId: req.user._id,
      meta: { from: previousStatus, to: status }
    });
    runAutomations('status_change', {
      taskId: req.task._id,
      projectId: req.task.projectId,
      previousStatus,
      status
    });

    res.status(200).json({ success: true, message: 'Task status updated', task: req.task });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE TASK ASSIGNEES
// PATCH /api/tasks/:taskId/assign
// Requires: requireRole('Owner','Admin','Member') — Guests cannot reassign
// ============================================
exports.assignTask = async (req, res, next) => {
  try {
    const { assigneeIds } = req.body;

    if (!Array.isArray(assigneeIds)) {
      return next(new AppError('assigneeIds must be an array', 400));
    }

    if (req.project.members.length > 0) {
      const projectMemberIds = req.project.members.map((m) => m.userId.toString());
      const invalidAssignee = assigneeIds.find((a) => !projectMemberIds.includes(a));
      if (invalidAssignee) {
        return next(new AppError('All assignees must have access to this project', 400));
      }
    }

    const previousAssignees = req.task.assignees.map((a) => a.toString());
    req.task.assignees = assigneeIds;
    await req.task.save();

    const newlyAssigned = assigneeIds.filter((id) => !previousAssignees.includes(id));
    if (newlyAssigned.length > 0) {
      await createNotifications(newlyAssigned, {
        type: 'assignment',
        message: `${req.user.name} assigned you to "${req.task.title}"`,
        entityType: 'Task',
        entityId: req.task._id,
        link: `/projects/${req.task.projectId}/tasks`,
        triggeredBy: req.user._id
      });
    }

    emitToProject(req.task.projectId, 'task:updated', req.task);
    logActivity({
      entityType: 'Task',
      entityId: req.task._id,
      projectId: req.task.projectId,
      action: 'assignees_updated',
      userId: req.user._id,
      meta: { assignees: assigneeIds }
    });
    runAutomations('task_assigned', {
      taskId: req.task._id,
      projectId: req.task.projectId,
      assigneeIds
    });

    res.status(200).json({ success: true, message: 'Assignees updated', task: req.task });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REORDER TASK (drag-and-drop in List/Board views)
// PATCH /api/tasks/:taskId/reorder
// ============================================
exports.reorderTask = async (req, res, next) => {
  try {
    const { newOrder } = req.body;

    if (typeof newOrder !== 'number') {
      return next(new AppError('newOrder must be a number', 400));
    }

    req.task.order = newOrder;
    await req.task.save();

    res.status(200).json({ success: true, message: 'Task reordered', task: req.task });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE TASK (soft delete/archive — cascades to direct subtasks)
// DELETE /api/tasks/:taskId
// Requires: requireTaskManagePermission (Owner/Admin OR creator)
// ============================================
exports.deleteTask = async (req, res, next) => {
  try {
    req.task.isArchived = true;
    await req.task.save();

    // Archive direct subtasks too, so they don't linger as orphaned visible tasks
    await Task.updateMany({ parentTaskId: req.task._id }, { isArchived: true });

    emitToProject(req.task.projectId, 'task:deleted', { taskId: req.task._id });
    logActivity({
      entityType: 'Task',
      entityId: req.task._id,
      projectId: req.task.projectId,
      action: 'task_deleted',
      userId: req.user._id,
      meta: { title: req.task.title }
    });

    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};
