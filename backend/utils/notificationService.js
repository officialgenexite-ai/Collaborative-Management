const Notification = require('../models/Notification');
const { emitToUser } = require('./socketService');

/**
 * createNotification
 * ---------------------
 * Single entry point for every module to raise a notification.
 * 1. Never notify a user about their own action (e.g. self-mention,
 *    self-assignment) — silently skips if userId === triggeredBy
 * 2. Saves the notification document
 * 3. Immediately pushes it over Socket.io to that user's personal room
 *    ("user:<userId>", joined automatically on socket connect — see
 *    socketService.js) so the bell icon updates without a page refresh
 *
 * @param {Object} params
 * @param {string} params.userId - recipient
 * @param {string} params.type - 'mention' | 'assignment' | 'invite' | 'comment_reply' | 'status_change'
 * @param {string} params.message - human-readable text
 * @param {string} params.entityType - 'Task' | 'Comment' | 'Project' | 'Workspace'
 * @param {string} params.entityId
 * @param {string} params.link - frontend route for the notification to open
 * @param {string} params.triggeredBy - the user who caused this notification
 */
async function createNotification({ userId, type, message, entityType, entityId, link, triggeredBy }) {
  if (!userId || userId.toString() === triggeredBy?.toString()) {
    return null; // don't notify people about their own actions
  }

  const notification = await Notification.create({
    userId,
    type,
    message,
    entityType,
    entityId,
    link: link || '',
    triggeredBy
  });

  emitToUser(userId, 'notification:new', notification);

  return notification;
}

/**
 * createNotifications
 * ----------------------
 * Convenience wrapper for the common case of notifying several users at
 * once (e.g. every newly mentioned user in a comment).
 */
async function createNotifications(userIds, params) {
  const results = await Promise.all(
    (userIds || []).map((userId) => createNotification({ ...params, userId }))
  );
  return results.filter(Boolean);
}

module.exports = { createNotification, createNotifications };
