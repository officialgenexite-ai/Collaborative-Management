import axiosInstance from '../../api/axiosInstance';

export const getTaskActivity = (taskId) => axiosInstance.get(`/tasks/${taskId}/activity`);

export const getProjectActivity = (projectId) => axiosInstance.get(`/projects/${projectId}/activity`);
