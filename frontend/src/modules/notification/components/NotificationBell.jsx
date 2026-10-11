import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../hooks/useNotification';

const TYPE_ICONS = {
  mention: '💬',
  assignment: '📌',
  invite: '🏢',
  comment_reply: '↩️',
  status_change: '🔄'
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    removeNotification
  } = useNotification();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next) fetchNotifications();
      return next;
    });
  };

  const handleClick = async (notification) => {
    if (!notification.isRead) await markRead(notification._id);
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="fixed top-4 right-4 z-40" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900">Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary font-medium">
                Mark all read
              </button>
            )}
          </div>

          {loading && <p className="text-xs text-gray-400 px-4 py-3">Loading...</p>}

          {!loading && notifications.length === 0 && (
            <p className="text-xs text-gray-400 px-4 py-6 text-center">No notifications yet</p>
          )}

          {notifications.map((n) => (
            <div
              key={n._id}
              className={`flex items-start gap-2 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                !n.isRead ? 'bg-primary/5' : ''
              }`}
              onClick={() => handleClick(n)}
            >
              <span className="text-base shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(n._id);
                }}
                className="text-gray-300 hover:text-red-500 text-xs shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
