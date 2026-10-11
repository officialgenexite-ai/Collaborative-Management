const ActivityLog = require('../models/ActivityLog');
const { emitToProject } = require('./socketService');

/**
 * logActivity
 * -------------
 * Saves one audit-trail entry and, if a projectId is available, pushes it
 * live to that project's Socket.io room so an open Activity feed updates
 * without a refresh (same room Task/Comment events already use).
 */
async function logActivity({ entityType, entityId, projectId, action, userId, meta }) {
  const entry = await ActivityLog.create({
    entityType,
    entityId,
    projectId: projectId || undefined,
    action,
    userId,
    meta: meta || {}
  });

  await entry.populate('userId', 'name avatar');

  if (projectId) {
    emitToProject(projectId, 'activity:new', entry);
  }

  return entry;
}

module.exports = { logActivity };
