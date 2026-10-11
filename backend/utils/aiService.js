const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const { emitToProject } = require('./socketService');
const { logActivity } = require('./activityLogService');
const { searchSimilar } = require('./embeddingService');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const CHAT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Tried in order on 503 "high demand" errors — a known, widely-reported
// Google-side capacity issue, not a quota/key problem. Non-503 errors
// (real bugs) are NOT retried — they throw immediately.
const FALLBACK_MODELS = [CHAT_MODEL, 'gemini-2.0-flash', 'gemini-1.5-flash'];

async function withModelFallback(buildAndRun) {
  let lastError;
  for (const modelName of FALLBACK_MODELS) {
    try {
      return await buildAndRun(modelName);
    } catch (err) {
      lastError = err;
      const is503 = err.status === 503 || /503|UNAVAILABLE|high demand/i.test(err.message || '');
      if (!is503) throw err;
      console.warn(`[gemini] ${modelName} unavailable (503), trying next fallback...`);
    }
  }
  throw lastError;
}

// ============================================
// Tool definitions — the exact shape Gemini's function-calling expects.
// Each one maps 1:1 to a case in executeToolCall() below.
// ============================================
const TOOLS = [
  {
    name: 'create_task',
    description: 'Create a new task in the current project',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: 'Task title' },
        description: { type: SchemaType.STRING, description: 'Task description' },
        assigneeName: { type: SchemaType.STRING, description: 'Name of the person to assign, if mentioned' },
        priority: { type: SchemaType.STRING, format: 'enum', enum: ['Low', 'Medium', 'High', 'Urgent'] }
      },
      required: ['title']
    }
  },
  {
    name: 'update_task_status',
    description: 'Change the status of an existing task, found by its title',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskTitle: { type: SchemaType.STRING, description: 'Title or partial title of the task' },
        newStatus: { type: SchemaType.STRING, format: 'enum', enum: ['To Do', 'In Progress', 'In Review', 'Done'] }
      },
      required: ['taskTitle', 'newStatus']
    }
  },
  {
    name: 'assign_task',
    description: 'Assign an existing task to a workspace member, found by name',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskTitle: { type: SchemaType.STRING },
        assigneeName: { type: SchemaType.STRING }
      },
      required: ['taskTitle', 'assigneeName']
    }
  }
];

/**
 * runCommand
 * ------------
 * Sends the user's natural-language message to Gemini with the tool
 * definitions attached. Gemini decides whether this is a plain question
 * (returns text) or an action (returns a function call), which we then
 * execute against the real database — same models the REST controllers use.
 */
async function runCommand(message, context, history = []) {
  // RAG retrieval is best-effort — a search failure (empty index, Atlas
  // hiccup) should never block the chat from responding.
  let chunks = [];
  try {
    chunks = await searchSimilar(context.project._id, message, 4);
  } catch (err) {
    chunks = [];
  }

  const recentTasks = await Task.find({ projectId: context.project._id, isArchived: false })
    .populate('assignees', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  const liveTasksContext = recentTasks.length
    ? `Current tasks in this project (GROUND TRUTH — use this for any factual question, e.g. "last task", "who's assigned", "what's the status"; never guess from earlier conversation):\n${recentTasks
        .map((t) => `- "${t.title}" | Status: ${t.status} \vert{} Assignees:${t.assignees.map((a) => a.name).join(', ') || 'Unassigned'}`)
        .join('\n')}`
    : '';

  const ragContext = chunks.length
    ? `Here is relevant project data that may help answer the user's question. Cite it inline as [1], [2], etc. when you use it, and don't invent facts beyond what's here or common sense:\n\n${chunks
        .map((c, i) => `[${i + 1}] (${c.sourceType})${c.text}`)
        .join('\n\n')}`
    : '';

  const groundingContext = [liveTasksContext, ragContext].filter(Boolean).join('\n\n---\n\n') || undefined;

  const result = await withModelFallback(async (modelName) => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      tools: [{ functionDeclarations: TOOLS }],
      systemInstruction: groundingContext
    });
    const chat = model.startChat({
      history: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] }))
    });
    return chat.sendMessage(message);
  });
  const call = result.response.functionCalls()?.[0];

  if (!call) {
    return {
      type: 'text',
      message: result.response.text(),
      sources: chunks.map((c) => ({ sourceType: c.sourceType, sourceId: c.sourceId, score: c.score }))
    };
  }

  const output = await executeToolCall(call.name, call.args, context);
  return { type: 'action', action: call.name, args: call.args, output };
}

async function executeToolCall(name, args, context) {
  const { project, workspace, userId } = context;

  if (name === 'create_task') {
    let assignees = [];
    if (args.assigneeName) {
      const member = findMemberByName(workspace, args.assigneeName);
      if (member) assignees = [member.userId._id || member.userId];
    }

    const lastTask = await Task.findOne({ projectId: project._id }).sort({ order: -1 });
    const task = await Task.create({
      projectId: project._id,
      title: args.title,
      description: args.description || '',
      assignees,
      priority: args.priority || 'Medium',
      order: lastTask ? lastTask.order + 1 : 0,
      createdBy: userId
    });

    emitToProject(project._id, 'task:created', task);
    logActivity({
      entityType: 'Task',
      entityId: task._id,
      projectId: project._id,
      action: 'task_created',
      userId,
      meta: { title: task.title, viaAI: true }
    });

    return { message: `Created task "${task.title}"${assignees.length ? ' and assigned it' : ''}.`, task };
  }

  if (name === 'update_task_status') {
    const task = await findTaskByTitle(project._id, args.taskTitle);
    if (!task) return { message: `Couldn't find a task matching "${args.taskTitle}".` };

    task.status = args.newStatus;
    await task.save();
    emitToProject(project._id, 'task:updated', task);

    return { message: `Updated "${task.title}" to ${args.newStatus}.`, task };
  }

  if (name === 'assign_task') {
    const task = await findTaskByTitle(project._id, args.taskTitle);
    if (!task) return { message: `Couldn't find a task matching "${args.taskTitle}".` };

    const member = findMemberByName(workspace, args.assigneeName);
    if (!member) return { message: `Couldn't find a workspace member named "${args.assigneeName}".` };

    const memberId = (member.userId._id || member.userId).toString();
    if (!task.assignees.some((a) => a.toString() === memberId)) {
      task.assignees.push(memberId);
      await task.save();
      emitToProject(project._id, 'task:updated', task);
    }

    return { message: `Assigned "${task.title}" to ${args.assigneeName}.`, task };
  }

  return { message: 'Unknown action.' };
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// Requires workspace.members.userId to be POPULATED with `name` —
// the controller is responsible for passing a populated workspace.
function findMemberByName(workspace, name) {
  const target = name.toLowerCase().trim();
  let best = null;
  let bestScore = Infinity;
  for (const m of workspace.members) {
    const candidate = (m.userId?.name || '').toLowerCase().trim();
    if (!candidate) continue;
    if (candidate.includes(target) || target.includes(candidate)) return m; // exact/substring match wins immediately
    const dist = levenshtein(target, candidate);
    if (dist < bestScore) {
      bestScore = dist;
      best = m;
    }
  }
  return bestScore <= 2 ? best : null; // tolerate up to 2-character typos
}

async function findTaskByTitle(projectId, titleFragment) {
  return Task.findOne({
    projectId,
    isArchived: false,
    title: { $regex: titleFragment,$options: 'i' }
  });
}

/**
 * summarizeTask
 * ---------------
 * Pulls a task's description + all comments + activity log, and asks
 * Gemini for a short catch-up summary — so a new team member doesn't
 * have to read the whole thread.
 */
async function summarizeTask(task) {
  const comments = await Comment.find({ taskId: task._id, isDeleted: false })
    .populate('userId', 'name')
    .sort({ createdAt: 1 });
  const activity = await ActivityLog.find({ entityType: 'Task', entityId: task._id }).sort({ createdAt: 1 });

  const commentText = comments.map((c) => `${c.userId?.name}: ${c.text}`).join('\n') || '(no comments)';
  const activityText = activity.map((a) => `${a.action} ${JSON.stringify(a.meta)}`).join('\n') || '(no activity)';

  const prompt = `Summarize this task thread in 3-4 sentences for a new team member joining the project. Be concise and factual.

Task: ${task.title}
Description: ${task.description || '(none)'}

Activity log:
${activityText}

Comments:
${commentText}`;

  const result = await withModelFallback((modelName) =>
    genAI.getGenerativeModel({ model: modelName }).generateContent(prompt)
  );
  return result.response.text();
}

/**
 * transcribeAudio
 * -----------------
 * Gemini accepts audio natively as an inline base64 part — no separate
 * speech-to-text service needed. Returns plain transcribed text, which
 * then flows into the SAME runCommand() pipeline as a typed message.
 */
async function transcribeAudio(buffer, mimeType) {
  const result = await withModelFallback((modelName) =>
    genAI.getGenerativeModel({ model: modelName }).generateContent([
      { inlineData: { data: buffer.toString('base64'), mimeType } },
      { text: 'Transcribe this audio exactly as spoken. Return only the transcription, no commentary.' }
    ])
  );
  return result.response.text().trim();
}

/**
 * extractTaskFromImage
 * -----------------------
 * Vision input (screenshot, photo of handwritten notes/whiteboard) ->
 * a suggested task title + description. Returned as text for the user
 * to review/edit in the chat before it becomes a real task — NOT
 * auto-created, since vision extraction can misread things.
 */
async function extractTaskFromImage(buffer, mimeType, caption) {
  const prompt = `Look at this image (it might be a screenshot, a photo of handwritten notes, or a whiteboard). Extract a concise task title and description that a project management tool could use.${
    caption ? ` Additional context from the user: "${caption}"` : ''
  }

Respond in this exact format:
Title: <short title>
Description: <one paragraph description>`;

  const result = await withModelFallback((modelName) =>
    genAI.getGenerativeModel({ model: modelName }).generateContent([
      { inlineData: { data: buffer.toString('base64'), mimeType } },
      { text: prompt }
    ])
  );
  return result.response.text().trim();
}

/**
 * analyzeSentiment
 * ------------------
 * Cheap, single-word classification used as a team-health signal on
 * comments and tasks. Returns null on empty input so callers can skip
 * saving a sentiment for blank text.
 */
async function analyzeSentiment(text) {
  if (!text || !text.trim()) return null;

  const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
  const prompt = `Classify the sentiment of this team message as exactly one word: positive, neutral, negative, or frustrated (frustrated = negative AND expressing annoyance or feeling blocked). Respond with ONLY that one word, nothing else.

Message: "${text}"`;

  const result = await model.generateContent(prompt);
  const label = result.response.text().trim().toLowerCase();
  const valid = ['positive', 'neutral', 'negative', 'frustrated'];
  return valid.includes(label) ? label : 'neutral';
}

module.exports = { runCommand, summarizeTask, transcribeAudio, extractTaskFromImage, analyzeSentiment };
