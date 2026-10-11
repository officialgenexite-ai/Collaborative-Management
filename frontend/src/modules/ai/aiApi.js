import axiosInstance from '../../api/axiosInstance';
export const reindexProject = (projectId) => axiosInstance.post(`/projects/${projectId}/knowledge/reindex`);
export const sendCommand = (projectId, message) =>
  axiosInstance.post(`/projects/${projectId}/ai/command`, { message });

export const getConversation = (projectId) => axiosInstance.get(`/projects/${projectId}/ai/conversation`);

export const clearConversation = (projectId) => axiosInstance.delete(`/projects/${projectId}/ai/conversation`);

export const getTaskSummary = (taskId) => axiosInstance.get(`/tasks/${taskId}/summary`);
export const sendVoiceCommand = (projectId, audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice.webm');
  return axiosInstance.post(`/projects/${projectId}/ai/voice-command`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const sendImageCommand = (projectId, file, caption) => {
  const formData = new FormData();
  formData.append('image', file);
  if (caption) formData.append('caption', caption);
  return axiosInstance.post(`/projects/${projectId}/ai/image-command`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
