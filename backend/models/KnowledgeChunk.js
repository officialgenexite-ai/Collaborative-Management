const mongoose = require('mongoose');

const knowledgeChunkSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    sourceType: {
      type: String,
      enum: ['Task', 'Comment'],
      required: true
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true
    },
    embedding: {
      type: [Number], // 768 dimensions from Gemini's text-embedding-004
      required: true
    }
  },
  { timestamps: true }
);

// One chunk per source document — re-indexing overwrites rather than duplicating
knowledgeChunkSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });

module.exports = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
