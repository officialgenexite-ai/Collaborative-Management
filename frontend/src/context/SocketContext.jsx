import { createContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

export const SocketContext = createContext(null);

// Derives the socket server URL from the API base URL by stripping the
// trailing /api — e.g. http://localhost:5000/api -> http://localhost:5000
const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // ============================================
  // ALGORITHM
  // 1. Connect only when the user is authenticated AND we have a token
  // 2. Pass the token via `auth` — read once at handshake by the
  //    backend's io.use() middleware (see services/socketService.js)
  // 3. On logout (isAuthenticated becomes false) or unmount, disconnect
  //    cleanly so no stale connection lingers
  // ============================================
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  const joinProject = (projectId) => socketRef.current?.emit('project:join', projectId);
  const leaveProject = (projectId) => socketRef.current?.emit('project:leave', projectId);
  const joinWorkspace = (workspaceId) => socketRef.current?.emit('workspace:join', workspaceId);
  const leaveWorkspace = (workspaceId) => socketRef.current?.emit('workspace:leave', workspaceId);

  const value = {
    socket: socketRef.current,
    connected,
    joinProject,
    leaveProject,
    joinWorkspace,
    leaveWorkspace
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
