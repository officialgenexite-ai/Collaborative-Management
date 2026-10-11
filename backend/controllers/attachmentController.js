const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Project = require('../models/Project');
const Workspace = require('../models/Workspace');
const { AppError } = require('../middleware/errorHandler');
const { uploadBuffer, deleteFile } = require('../utils/cloudinaryService');
const { emitToProject } = require('../utils/socketService');
const { logActivity } = require('../utils/activityLogService');

// ============================================
// UPLOAD ATTACHMENT TO A TASK
// POST /api/tasks/:taskId/attachments
// Requires: loadTaskAndCheckAccess + upload.single('file')
// ============================================
exports.uploadTaskAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const result = await uploadBuffer(req.file.buffer, `tasks/${req.task._id}`);

    const attachment = await Attachment.create({
      entityType: 'Task',
      entityId: req.task._id,
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id
    });

    await attachment.populate('uploadedBy', 'name avatar');

    emitToProject(req.task.projectId, 'attachment:new', attachment);
    logActivity({
      entityType: 'Task',
      entityId: req.task._id,
      projectId: req.task.projectId,
      action: 'attachment_added',
      userId: req.user._id,
      meta: { fileName: attachment.fileName }
    });

    res.status(201).json({ success: true, message: 'File uploaded', attachment });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LIST ATTACHMENTS FOR A TASK
// GET /api/tasks/:taskId/attachments
// ============================================
exports.getTaskAttachments = async (req, res, next) => {
  try {
    const attachments = await Attachment.find({ entityType: 'Task', entityId: req.task._id })
      .populate('uploadedBy', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: attachments.length, attachments });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPLOAD ATTACHMENT TO A COMMENT
// POST /api/comments/:commentId/attachments
// Requires: loadCommentAndCheckAccess + upload.single('file')
// ============================================
exports.uploadCommentAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const result = await uploadBuffer(req.file.buffer, `comments/${req.comment._id}`);

    const attachment = await Attachment.create({
      entityType: 'Comment',
      entityId: req.comment._id,
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id
    });

    await attachment.populate('uploadedBy', 'name avatar');

    emitToProject(req.task.projectId, 'attachment:new', attachment);

    res.status(201).json({ success: true, message: 'File uploaded', attachment });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE ATTACHMENT (works for both Task and Comment attachments)
// DELETE /api/attachments/:id
// Not nested under /tasks or /comments, so access is resolved here
// directly rather than via loadTaskAndCheckAccess/loadCommentAndCheckAccess.
// Permission: uploader OR workspace Owner/Admin.
// ============================================
exports.deleteAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
      return next(new AppError('Attachment not found', 404));
    }

    let projectId;
    if (attachment.entityType === 'Task') {
      const task = await Task.findById(attachment.entityId);
      if (!task) return next(new AppError('Parent task not found', 404));
      projectId = task.projectId;
    } else {
      const comment = await Comment.findById(attachment.entityId);
      if (!comment) return next(new AppError('Parent comment not found', 404));
      const task = await Task.findById(comment.taskId);
      if (!task) return next(new AppError('Parent task not found', 404));
      projectId = task.projectId;
    }

    const project = await Project.findById(projectId);
    if (!project) return next(new AppError('Parent project not found', 404));

    const workspace = await Workspace.findById(project.workspaceId);
    if (!workspace) return next(new AppError('Parent workspace not found', 404));

    const memberEntry = workspace.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    if (!memberEntry) {
      return next(new AppError('You are not a member of this workspace', 403));
    }

    const isUploader = attachment.uploadedBy.toString() === req.user._id.toString();
    const isOwnerOrAdmin = memberEntry.role === 'Owner' || memberEntry.role === 'Admin';

    if (!isUploader && !isOwnerOrAdmin) {
      return next(new AppError('Only the uploader or a workspace Admin/Owner can delete this file', 403));
    }

    const resourceType = attachment.fileType === 'application/pdf' ? 'raw' : 'image';
    await deleteFile(attachment.publicId, resourceType);
    await attachment.deleteOne();

    res.status(200).json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    next(error);
  }
};
