const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

/**
 * initSocket(httpServer)
 * ------------------------
 * ALGORITHM:
 * 1. Attach Socket.io to the same HTTP server as Express (not a separate port)
 * 2. Authenticate every connection at handshake time (not per-event) —
 *    same JWT the REST API uses, verified the same way
 * 3. On connect, the client explicitly joins rooms for whatever it's
 *    currently viewing (a project, a workspace) — nothing is auto-joined
 * 4. Controllers call emitToProject/emitToWorkspace after a DB write;
 *    they never touch `io` directly (keeps controllers testable/decoupled)
 *
 * ⚠️ INTEGRATION NOTE: this assumes your JWT payload has either `id` or
 * `userId` for the user's Mongo _id, and that process.env.JWT_SECRET is
 * the same secret your authMiddleware.protect already verifies with.
 * Adjust the two marked lines below if your existing Auth module uses
 * different names.
 */
function initSocket(httpServer) {
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
  console.log(`[socket.io] CORS allowed origin: ${allowedOrigin}`); // remove once confirmed working

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId; // matches jwt.sign({ userId: user._id }, ...) in authController.js

      const user = await User.findById(userId).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Every authenticated socket auto-joins its own personal room —
    // this is how createNotification() in notificationService.js delivers
    // directly to one user without them explicitly subscribing to anything.
    socket.join(`user:${socket.user._id}`);

    // Room strategy:
    // - "user:<userId>" -> personal notifications (auto-joined above)
    // - "project:<projectId>" -> task/comment updates scoped to one project
    // - "workspace:<workspaceId>" -> workspace/project-level updates
    socket.on('project:join', (projectId) => {
      if (projectId) socket.join(`project:${projectId}`);
    });

    socket.on('project:leave', (projectId) => {
      if (projectId) socket.leave(`project:${projectId}`);
    });

    socket.on('workspace:join', (workspaceId) => {
      if (workspaceId) socket.join(`workspace:${workspaceId}`);
    });

    socket.on('workspace:leave', (workspaceId) => {
      if (workspaceId) socket.leave(`workspace:${workspaceId}`);
    });

    socket.on('disconnect', () => {
      // no-op — Socket.io cleans up room membership automatically
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket(httpServer) first.');
  }
  return io;
}

// Emit helpers — controllers import ONLY these, never `io` directly
function emitToProject(projectId, event, payload) {
  if (!io) return;
  io.to(`project:${projectId}`).emit(event, payload);
}

function emitToWorkspace(workspaceId, event, payload) {
  if (!io) return;
  io.to(`workspace:${workspaceId}`).emit(event, payload);
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToProject, emitToWorkspace, emitToUser };
