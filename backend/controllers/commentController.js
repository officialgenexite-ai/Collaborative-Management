const Comment = require('../models/Comment');
const { AppError } = require('../middleware/errorHandler');
const { emitToProject } = require('../utils/socketService');
const { upsertChunk, deleteChunk } = require('../utils/embeddingService');
const { analyzeSentiment } = require('../utils/aiService');
const { createNotifications } = require('../utils/notificationService');

// ============================================
// CREATE COMMENT (top-level, on a task)
// POST /api/tasks/:taskId/comments
// Requires: loadTaskAndCheckAccess (any role with task/project access, Guest included)
// ============================================
exports.createComment = async (req, res, next) => {
  try {
    const { text, mentions } = req.body;

    if (!text || !text.trim()) {
      return next(new AppError('Comment text is required', 400));
    }

    const comment = new Comment({
      taskId: req.task._id,
      userId: req.user._id,
      text: text.trim(),
      mentions: mentions || [],
      parentCommentId: null
    });

    await comment.save();
    await comment.populate('userId', 'name email avatar');
    await comment.populate('mentions', 'name email');

    if (mentions && mentions.length > 0) {
      await createNotifications(mentions, {
        type: 'mention',
        message: `${req.user.name} mentioned you in a comment`,
        entityType: 'Comment',
        entityId: comment._id,
        link: `/projects/${req.project._id}/tasks`,
        triggeredBy: req.user._id
      });
    }

    emitToProject(req.task.projectId, 'comment:new', comment);
    upsertChunk({
      projectId: req.task.projectId,
      sourceType: 'Comment',
      sourceId: comment._id,
      text: comment.text
    }).catch(() => {});

    // Fire-and-forget — never blocks the response. Sentiment lands a
    // moment later via a follow-up 'comment:updated' emit.
    analyzeSentiment(text)
      .then(async (sentiment) => {
        if (!sentiment) return;
        comment.sentiment = sentiment;
        await comment.save();
        emitToProject(req.task.projectId, 'comment:updated', comment);
      })
      .catch((err) => console.error('[sentiment] comment analysis failed:', err.message));

    res.status(201).json({ success: true, message: 'Comment added', comment });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LIST COMMENTS FOR A TASK
// GET /api/tasks/:taskId/comments
// Returns a flat, chronological list — the frontend groups replies under
// their parent using parentCommentId for the threaded view.
// ============================================
exports.getTaskComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ taskId: req.task._id, isDeleted: false })
      .populate('userId', 'name email avatar')
      .populate('mentions', 'name email')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: comments.length, comments });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REPLY TO A COMMENT (creates a threaded child comment)
// POST /api/comments/:commentId/reply
// Requires: loadCommentAndCheckAccess
// ============================================
exports.replyToComment = async (req, res, next) => {
  try {
    const { text, mentions } = req.body;

    if (!text || !text.trim()) {
      return next(new AppError('Reply text is required', 400));
    }

    const reply = new Comment({
      taskId: req.comment.taskId,
      userId: req.user._id,
      text: text.trim(),
      mentions: mentions || [],
      parentCommentId: req.comment._id
    });

    await reply.save();
    await reply.populate('userId', 'name email avatar');
    await reply.populate('mentions', 'name email');

    if (mentions && mentions.length > 0) {
      await createNotifications(mentions, {
        type: 'mention',
        message: `${req.user.name} mentioned you in a reply`,
        entityType: 'Comment',
        entityId: reply._id,
        link: `/projects/${req.project._id}/tasks`,
        triggeredBy: req.user._id
      });
    }

    // Also let the parent comment's author know someone replied (if not the same person)
    await createNotifications([req.comment.userId], {
      type: 'comment_reply',
      message: `${req.user.name} replied to your comment`,
      entityType: 'Comment',
      entityId: reply._id,
      link: `/projects/${req.project._id}/tasks`,
      triggeredBy: req.user._id
    });

    emitToProject(req.task.projectId, 'comment:new', reply);

    res.status(201).json({ success: true, message: 'Reply added', comment: reply });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE COMMENT (edit own text)
// PATCH /api/comments/:commentId
// Author-only by design — editing someone else's words, even as
// Owner/Admin, isn't a moderation action, so it's deliberately not
// covered by requireCommentAuthorOrManage.
// ============================================
exports.updateComment = async (req, res, next) => {
  try {
    if (!req.isCommentAuthor) {
      return next(new AppError('Only the comment author can edit this comment', 403));
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return next(new AppError('Comment text is required', 400));
    }

    req.comment.text = text.trim();
    req.comment.isEdited = true;
    await req.comment.save();
    await req.comment.populate('userId', 'name email avatar');

    emitToProject(req.task.projectId, 'comment:updated', req.comment);

    res.status(200).json({ success: true, message: 'Comment updated', comment: req.comment });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE COMMENT (soft delete)
// DELETE /api/comments/:commentId
// Requires: requireCommentAuthorOrManage (author OR Owner/Admin)
// ============================================
exports.deleteComment = async (req, res, next) => {
  try {
    req.comment.isDeleted = true;
    req.comment.text = '[deleted]';
    await req.comment.save();

    emitToProject(req.task.projectId, 'comment:deleted', { commentId: req.comment._id });
    deleteChunk('Comment', req.comment._id).catch(() => {});

    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// TOGGLE REACTION ON A COMMENT
// POST /api/comments/:commentId/react
// Same user + same emoji again removes it (toggle behavior).
// ============================================
exports.reactToComment = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      return next(new AppError('emoji is required', 400));
    }

    const userId = req.user._id.toString();
    const existingIndex = req.comment.reactions.findIndex(
      (r) => r.userId.toString() === userId && r.emoji === emoji
    );

    if (existingIndex >= 0) {
      req.comment.reactions.splice(existingIndex, 1);
    } else {
      req.comment.reactions.push({ userId: req.user._id, emoji });
    }

    await req.comment.save();

    emitToProject(req.task.projectId, 'comment:reaction', {
      commentId: req.comment._id,
      reactions: req.comment.reactions
    });

    res.status(200).json({ success: true, message: 'Reaction updated', reactions: req.comment.reactions });
  } catch (error) {
    next(error);
  }
};
