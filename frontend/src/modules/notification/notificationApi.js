import axiosInstance from '../../api/axiosInstance';

export const getNotifications = (page = 1, limit = 20) =>
  axiosInstance.get(`/notifications?page=${page}&limit=${limit}`);

export const markAsRead = (id) => axiosInstance.patch(`/notifications/${id}/read`);

export const markAllAsRead = () => axiosInstance.patch('/notifications/read-all');

export const deleteNotification = (id) => axiosInstance.delete(`/notifications/${id}`);
