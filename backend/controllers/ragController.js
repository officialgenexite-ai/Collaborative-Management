const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const { AppError } = require('../middleware/errorHandler');
const { upsertChunk, searchSimilar } = require('../utils/embeddingService');

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const CHAT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
// ============================================
// REINDEX A PROJECT (bulk — run once when enabling RAG, or after bulk data import)
// POST /api/projects/:projectId/knowledge/reindex
// Requires: requireRole('Owner','Admin')
// ============================================
exports.reindexProject = async (req, res, next) => {
  try {
    const tasks = await Task.find({ projectId: req.project._id, isArchived: false });
    const comments = await Comment.find({
      taskId: { $in: tasks.map((t) => t._id) },
      isDeleted: false
    });

    let indexed = 0;

    for (const task of tasks) {
      const text = `${task.title}\n${task.description || ''}`;
      await upsertChunk({ projectId: req.project._id, sourceType: 'Task', sourceId: task._id, text });
      indexed++;
    }

    for (const comment of comments) {
      await upsertChunk({
        projectId: req.project._id,
        sourceType: 'Comment',
        sourceId: comment._id,
        text: comment.text
      });
      indexed++;
    }

    res.status(200).json({ success: true, message: `Indexed ${indexed} items`, indexed });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ASK (RAG-powered question answering)
// POST /api/projects/:projectId/ai/ask
// Requires: checkProjectMembership (any role with project access)
// ============================================
exports.askKnowledgeBase = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return next(new AppError('question is required', 400));
    }

    const chunks = await searchSimilar(req.project._id, question.trim(), 5);

    if (chunks.length === 0) {
      return res.status(200).json({
        success: true,
        answer: "I don't have enough indexed data yet to answer that. Try reindexing the project first.",
        sources: []
      });
    }

    const context = chunks.map((c, i) => `[${i + 1}] (${c.sourceType}) ${c.text}`).join('\n\n');

    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
    const prompt = `Answer the question using ONLY the context below. If the context doesn't contain the answer, say so honestly. Cite sources by their [number].

Context:
${context}

Question: ${question.trim()}`;

    const result = await model.generateContent(prompt);

    res.status(200).json({
      success: true,
      answer: result.response.text(),
      sources: chunks.map((c) => ({ sourceType: c.sourceType, sourceId: c.sourceId, score: c.score }))
    });
  } catch (error) {
    next(error);
  }
};
