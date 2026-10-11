const { GoogleGenerativeAI } = require('@google/generative-ai');
const KnowledgeChunk = require('../models/KnowledgeChunk');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768; // Atlas vector_index ke numDimensions se match

async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
    outputDimensionality: EMBEDDING_DIMENSIONS
  });
  const values = result.embedding.values;
  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Embedding returned ${values.length} dimensions, expected ${EMBEDDING_DIMENSIONS}.`);
  }
  return values;
}

/**
 * upsertChunk
 * -------------
 * Called after a task/comment is created OR updated. Re-embeds the text
 * and overwrites the existing chunk for that source (unique index on
 * sourceType+sourceId prevents duplicates), so the knowledge base never
 * goes stale.
 */
async function upsertChunk({ projectId, sourceType, sourceId, text }) {
  if (!text || !text.trim()) return null;

  const embedding = await generateEmbedding(text);

  return KnowledgeChunk.findOneAndUpdate(
    { sourceType, sourceId },
    { projectId, sourceType, sourceId, text, embedding },
    { upsert: true, new: true }
  );
}

async function deleteChunk(sourceType, sourceId) {
  await KnowledgeChunk.deleteOne({ sourceType, sourceId });
}

/**
 * searchSimilar
 * ---------------
 * Embeds the query, then runs Atlas Vector Search filtered to this
 * project only (the "filter" field on the index — see setup instructions)
 * so one project's chatbot never surfaces another project's data.
 */
async function searchSimilar(projectId, queryText, topK = 5) {
  const queryEmbedding = await generateEmbedding(queryText);

  const results = await KnowledgeChunk.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: topK,
        filter: { projectId: projectId }
      }
    },
    {
      $project: {
        text: 1,
        sourceType: 1,
        sourceId: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]);

  return results;
}

module.exports = { generateEmbedding, upsertChunk, deleteChunk, searchSimilar };
