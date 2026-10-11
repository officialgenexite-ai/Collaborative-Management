import axiosInstance from '../../api/axiosInstance';

export const createComment = (taskId, payload) =>
  axiosInstance.post(`/tasks/${taskId}/comments`, payload);

export const getTaskComments = (taskId) => axiosInstance.get(`/tasks/${taskId}/comments`);

export const replyToComment = (commentId, payload) =>
  axiosInstance.post(`/comments/${commentId}/reply`, payload);

export const updateComment = (commentId, text) =>
  axiosInstance.patch(`/comments/${commentId}`, { text });

export const deleteComment = (commentId) => axiosInstance.delete(`/comments/${commentId}`);

export const reactToComment = (commentId, emoji) =>
  axiosInstance.post(`/comments/${commentId}/react`, { emoji });
