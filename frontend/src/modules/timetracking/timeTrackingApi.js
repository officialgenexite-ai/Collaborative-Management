import axiosInstance from '../../api/axiosInstance';

export const startTimer = (taskId) => axiosInstance.post(`/tasks/${taskId}/timer/start`);

export const stopTimer = (taskId) => axiosInstance.post(`/tasks/${taskId}/timer/stop`);

export const getActiveTimer = () => axiosInstance.get('/timer/active');

export const getTaskTimeLogs = (taskId) => axiosInstance.get(`/tasks/${taskId}/time-logs`);

export const updateEstimate = (taskId, estimatedMinutes) =>
  axiosInstance.patch(`/tasks/${taskId}/estimate`, { estimatedMinutes });

export const getMyTimesheet = (startDate, endDate) =>
  axiosInstance.get(`/timesheet?startDate=${startDate}&endDate=${endDate}`);
