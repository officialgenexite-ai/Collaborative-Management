const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { loadTaskAndCheckAccess } = require('../middleware/taskAccessMiddleware');
const { loadCommentAndCheckAccess, requireCommentAuthorOrManage } = require('../middleware/commentAccessMiddleware');

const {
  createComment,
  getTaskComments,
  replyToComment,
  updateComment,
  deleteComment,
  reactToComment
} = require('../controllers/commentController');

// ============================================
// TASK-SCOPED (top-level comments)
// ============================================

router.post('/tasks/:taskId/comments', protect, loadTaskAndCheckAccess, createComment);
router.get('/tasks/:taskId/comments', protect, loadTaskAndCheckAccess, getTaskComments);

// ============================================
// COMMENT-SCOPED (replies, edit, delete, react)
// ============================================

router.post('/comments/:commentId/reply', protect, loadCommentAndCheckAccess, replyToComment);
router.patch('/comments/:commentId', protect, loadCommentAndCheckAccess, updateComment);
router.delete(
  '/comments/:commentId',
  protect,
  loadCommentAndCheckAccess,
  requireCommentAuthorOrManage,
  deleteComment
);
router.post('/comments/:commentId/react', protect, loadCommentAndCheckAccess, reactToComment);

module.exports = router;
