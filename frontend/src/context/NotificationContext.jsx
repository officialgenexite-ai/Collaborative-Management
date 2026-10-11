import { createContext, useState, useCallback, useEffect } from 'react';
import * as notificationApi from '../modules/notification/notificationApi';
import { useSocket } from '../hooks/useSocket';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { socket, connected } = useSocket();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      // silent — a failed bell fetch shouldn't interrupt the rest of the app
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    await notificationApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback(async (id) => {
    await notificationApi.deleteNotification(id);
    setNotifications((prev) => {
      const target = prev.find((n) => n._id === id);
      if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n._id !== id);
    });
  }, []);

  // Backend auto-joins every authenticated socket to its own "user:<id>"
  // room (see socketService.js), so no explicit join call is needed here —
  // just listen.
  useEffect(() => {
    if (!connected) return;

    const handleNew = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification:new', handleNew);
    return () => socket.off('notification:new', handleNew);
  }, [connected, socket]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    removeNotification
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
