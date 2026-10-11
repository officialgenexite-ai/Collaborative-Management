import axiosInstance from '../../api/axiosInstance';

export const uploadTaskAttachment = (taskId, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return axiosInstance.post(`/tasks/${taskId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    }
  });
};

export const getTaskAttachments = (taskId) => axiosInstance.get(`/tasks/${taskId}/attachments`);

export const uploadCommentAttachment = (commentId, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return axiosInstance.post(`/comments/${commentId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    }
  });
};

export const deleteAttachment = (id) => axiosInstance.delete(`/attachments/${id}`);
