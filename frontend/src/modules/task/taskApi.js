import axiosInstance from '../../api/axiosInstance';

export const createTask = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/tasks`, payload);

export const getProjectTasks = (projectId) => axiosInstance.get(`/projects/${projectId}/tasks`);

export const getTaskById = (taskId) => axiosInstance.get(`/tasks/${taskId}`);

export const updateTask = (taskId, payload) => axiosInstance.patch(`/tasks/${taskId}`, payload);

export const updateTaskStatus = (taskId, status) =>
  axiosInstance.patch(`/tasks/${taskId}/status`, { status });

export const assignTask = (taskId, assigneeIds) =>
  axiosInstance.patch(`/tasks/${taskId}/assign`, { assigneeIds });

export const reorderTask = (taskId, newOrder) =>
  axiosInstance.patch(`/tasks/${taskId}/reorder`, { newOrder });

export const deleteTask = (taskId) => axiosInstance.delete(`/tasks/${taskId}`);
