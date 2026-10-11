import { createContext, useState, useCallback } from 'react';
import * as commentApi from '../modules/comment/commentApi';

export const CommentContext = createContext(null);

export function CommentProvider({ children }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTaskComments = useCallback(async (taskId) => {
    setLoading(true);
    setError('');
    try {
      const res = await commentApi.getTaskComments(taskId);
      setComments(res.data.comments);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, []);

  const addComment = useCallback(async (taskId, payload) => {
    const res = await commentApi.createComment(taskId, payload);
    setComments((prev) =>
      prev.some((c) => c._id === res.data.comment._id) ? prev : [...prev, res.data.comment]
    );
    return res.data.comment;
  }, []);

  const addReply = useCallback(async (commentId, payload) => {
    const res = await commentApi.replyToComment(commentId, payload);
    setComments((prev) =>
      prev.some((c) => c._id === res.data.comment._id) ? prev : [...prev, res.data.comment]
    );
    return res.data.comment;
  }, []);

  const editComment = useCallback(async (commentId, text) => {
    const res = await commentApi.updateComment(commentId, text);
    setComments((prev) => prev.map((c) => (c._id === commentId ? res.data.comment : c)));
    return res.data.comment;
  }, []);

  const removeComment = useCallback(async (commentId) => {
    await commentApi.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  }, []);

  const toggleReaction = useCallback(async (commentId, emoji) => {
    const res = await commentApi.reactToComment(commentId, emoji);
    setComments((prev) =>
      prev.map((c) => (c._id === commentId ? { ...c, reactions: res.data.reactions } : c))
    );
  }, []);

  // Applies a live Socket.io event so every browser viewing the same task stays in sync
  const applyRealtimeCommentEvent = useCallback((event, payload) => {
    if (event === 'comment:new') {
      setComments((prev) => (prev.some((c) => c._id === payload._id) ? prev : [...prev, payload]));
    } else if (event === 'comment:updated') {
      setComments((prev) => prev.map((c) => (c._id === payload._id ? payload : c)));
    } else if (event === 'comment:deleted') {
      setComments((prev) => prev.filter((c) => c._id !== payload.commentId));
    } else if (event === 'comment:reaction') {
      setComments((prev) =>
        prev.map((c) => (c._id === payload.commentId ? { ...c, reactions: payload.reactions } : c))
      );
    }
  }, []);

  const value = {
    comments,
    loading,
    error,
    fetchTaskComments,
    addComment,
    addReply,
    editComment,
    removeComment,
    toggleReaction,
    applyRealtimeCommentEvent
  };

  return <CommentContext.Provider value={value}>{children}</CommentContext.Provider>;
}
