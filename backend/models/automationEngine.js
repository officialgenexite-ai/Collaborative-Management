const AutomationRule = require('./AutomationRule');
const Task = require('./Task');
const { emitToProject } = require('../utils/socketService');
const { createNotifications } = require('../utils/notificationService');
const { logActivity } = require('../utils/activityLogService');

// An automation-triggered change (e.g. change_status) can itself match
// another rule, which could match another, etc. This caps the chain so
// rule A -> rule B -> rule A can never loop forever.
const MAX_DEPTH = 2;

/**
 * runAutomations
 * ----------------
 * Entry point called from controllers right after a tracked event
 * (status change, assignment). Finds active rules for this project +
 * event type, evaluates each rule's conditions against the event data,
 * and executes every action for rules that match.
 */
async function runAutomations(eventType, eventData, depth = 0) {
  if (depth >= MAX_DEPTH) return;

  const rules = await AutomationRule.find({
    projectId: eventData.projectId,
    isActive: true,
    'trigger.type': eventType
  });

  for (const rule of rules) {
    if (!evaluateConditions(rule.trigger.conditions, eventData)) continue;

    for (const action of rule.actions) {
      await executeAction(action, eventData, rule, depth);
    }

    logActivity({
      entityType: 'Task',
      entityId: eventData.taskId,
      projectId: eventData.projectId,
      action: 'automation_triggered',
      userId: rule.createdBy,
      meta: { ruleName: rule.name }
    });
  }
}

function evaluateConditions(conditions, eventData) {
  if (!conditions || conditions.length === 0) return true; // no conditions = always match
  return conditions.every((cond) => {
    const actual = eventData[cond.field];
    switch (cond.operator) {
      case 'equals':
        return actual === cond.value;
      case 'not_equals':
        return actual !== cond.value;
      case 'contains':
        return Array.isArray(actual) && actual.includes(cond.value);
      default:
        return false;
    }
  });
}

async function executeAction(action, eventData, rule, depth) {
  const task = await Task.findById(eventData.taskId);
  if (!task) return;

  switch (action.type) {
    case 'send_notification': {
      const targets = resolveNotificationTargets(action.params, task);
      await createNotifications(targets, {
        type: 'status_change',
        message: action.params.message || `Automation "${rule.name}" fired on "${task.title}"`,
        entityType: 'Task',
        entityId: task._id,
        link: `/projects/${task.projectId}/tasks`,
        triggeredBy: rule.createdBy
      });
      break;
    }

    case 'change_status': {
      const previousStatus = task.status;
      task.status = action.params.newStatus;
      await task.save();
      emitToProject(task.projectId, 'task:updated', task);

      // Recursively check if THIS change triggers more automations —
      // depth + 1 keeps the chain bounded by MAX_DEPTH.
      await runAutomations(
        'status_change',
        { ...eventData, taskId: task._id, previousStatus, status: task.status },
        depth + 1
      );
      break;
    }

    case 'assign_user': {
      const alreadyAssigned = task.assignees.some((a) => a.toString() === action.params.userId);
      if (!alreadyAssigned) {
        task.assignees.push(action.params.userId);
        await task.save();
        emitToProject(task.projectId, 'task:updated', task);
        await createNotifications([action.params.userId], {
          type: 'assignment',
          message: `Automation "${rule.name}" assigned you to "${task.title}"`,
          entityType: 'Task',
          entityId: task._id,
          link: `/projects/${task.projectId}/tasks`,
          triggeredBy: rule.createdBy
        });
      }
      break;
    }

    default:
      break;
  }
}

function resolveNotificationTargets(params, task) {
  if (params.targetType === 'assignees') return task.assignees.map((a) => a.toString());
  if (params.targetType === 'creator') return [task.createdBy.toString()];
  if (params.targetType === 'specific' && params.targetUserId) return [params.targetUserId];
  return [];
}

module.exports = { runAutomations };
