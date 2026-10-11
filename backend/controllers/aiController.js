const Workspace = require('../models/Workspace');
const AIConversation = require('../models/AIConversation');
const { AppError } = require('../middleware/errorHandler');
const { runCommand, summarizeTask, transcribeAudio, extractTaskFromImage } = require('../utils/aiService');

// ============================================
// PROCESS NATURAL LANGUAGE COMMAND
// POST /api/projects/:projectId/ai/command
// Requires: checkProjectMembership + requireRole('Owner','Admin','Member') (Guests excluded, same as task creation)
// ============================================
exports.processCommand = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return next(new AppError('message is required', 400));
    }

    // Populated so aiService's findMemberByName can match on member.userId.name
    const populatedWorkspace = await Workspace.findById(req.workspace._id).populate(
      'members.userId',
      'name email'
    );

    let conversation = await AIConversation.findOne({ userId: req.user._id, projectId: req.project._id });
    if (!conversation) {
      conversation = await AIConversation.create({
        userId: req.user._id,
        projectId: req.project._id,
        messages: []
      });
    }

    const result = await runCommand(
      message.trim(),
      { project: req.project, workspace: populatedWorkspace, userId: req.user._id },
      conversation.messages
    );

    const replyText = result.type === 'text' ? result.message : result.output?.message || 'Done.';

    conversation.messages.push({ role: 'user', text: message.trim() });
    conversation.messages.push({ role: 'model', text: replyText });
    // Keep only the last 20 messages so context sent to Gemini (and storage) stays bounded
    conversation.messages = conversation.messages.slice(-20);
    await conversation.save();

    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET CONVERSATION HISTORY
// GET /api/projects/:projectId/ai/conversation
// ============================================
exports.getConversation = async (req, res, next) => {
  try {
    const conversation = await AIConversation.findOne({
      userId: req.user._id,
      projectId: req.project._id
    });
    res.status(200).json({ success: true, messages: conversation?.messages || [] });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CLEAR CONVERSATION HISTORY
// DELETE /api/projects/:projectId/ai/conversation
// ============================================
exports.clearConversation = async (req, res, next) => {
  try {
    await AIConversation.findOneAndDelete({ userId: req.user._id, projectId: req.project._id });
    res.status(200).json({ success: true, message: 'Conversation cleared' });
  } catch (error) {
    next(error);
  }
};

// ============================================
// VOICE COMMAND (transcribe, then run through the SAME pipeline as text)
// POST /api/projects/:projectId/ai/voice-command
// ============================================
exports.processVoiceCommand = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No audio file uploaded', 400));
    }

    const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype);

    const populatedWorkspace = await Workspace.findById(req.workspace._id).populate(
      'members.userId',
      'name email'
    );

    let conversation = await AIConversation.findOne({ userId: req.user._id, projectId: req.project._id });
    if (!conversation) {
      conversation = await AIConversation.create({
        userId: req.user._id,
        projectId: req.project._id,
        messages: []
      });
    }

    const result = await runCommand(
      transcript,
      { project: req.project, workspace: populatedWorkspace, userId: req.user._id },
      conversation.messages
    );

    const replyText = result.type === 'text' ? result.message : result.output?.message || 'Done.';
    conversation.messages.push({ role: 'user', text: transcript });
    conversation.messages.push({ role: 'model', text: replyText });
    conversation.messages = conversation.messages.slice(-20);
    await conversation.save();

    res.status(200).json({ success: true, transcript, result });
  } catch (error) {
    next(error);
  }
};

// ============================================
// IMAGE -> SUGGESTED TASK (not auto-created — returned for user review)
// POST /api/projects/:projectId/ai/image-command
// ============================================
exports.processImageCommand = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image uploaded', 400));
    }

    const { caption } = req.body;
    const extracted = await extractTaskFromImage(req.file.buffer, req.file.mimetype, caption);

    res.status(200).json({ success: true, extracted });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET AI SUMMARY OF A TASK'S THREAD
// GET /api/tasks/:taskId/summary
// ============================================
exports.getTaskSummary = async (req, res, next) => {
  try {
    const summary = await summarizeTask(req.task);
    res.status(200).json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};
