const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { loadTaskAndCheckAccess } = require('../middleware/taskAccessMiddleware');
const { loadCommentAndCheckAccess } = require('../middleware/commentAccessMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
  uploadTaskAttachment,
  getTaskAttachments,
  uploadCommentAttachment,
  deleteAttachment
} = require('../controllers/attachmentController');

router.post(
  '/tasks/:taskId/attachments',
  protect,
  loadTaskAndCheckAccess,
  upload.single('file'),
  uploadTaskAttachment
);
router.get('/tasks/:taskId/attachments', protect, loadTaskAndCheckAccess, getTaskAttachments);

router.post(
  '/comments/:commentId/attachments',
  protect,
  loadCommentAndCheckAccess,
  upload.single('file'),
  uploadCommentAttachment
);

router.delete('/attachments/:id', protect, deleteAttachment);

module.exports = router;
