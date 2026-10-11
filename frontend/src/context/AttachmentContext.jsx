import { createContext, useState, useCallback } from 'react';
import * as attachmentApi from '../modules/attachment/attachmentApi';

export const AttachmentContext = createContext(null);

export function AttachmentProvider({ children }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const fetchTaskAttachments = useCallback(async (taskId) => {
    setLoading(true);
    try {
      const res = await attachmentApi.getTaskAttachments(taskId);
      setAttachments(res.data.attachments);
    } catch (err) {
      // silent — attachments panel is supplementary, shouldn't block the modal
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadToTask = useCallback(async (taskId, file) => {
    setUploading(true);
    setUploadProgress(0);
    setError('');
    try {
      const res = await attachmentApi.uploadTaskAttachment(taskId, file, setUploadProgress);
      setAttachments((prev) => [res.data.attachment, ...prev]);
      return res.data.attachment;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const removeAttachment = useCallback(async (id) => {
    await attachmentApi.deleteAttachment(id);
    setAttachments((prev) => prev.filter((a) => a._id !== id));
  }, []);

  // Live push — same project room Task/Comment events already use
  const applyRealtimeAttachment = useCallback((attachment) => {
    setAttachments((prev) => (prev.some((a) => a._id === attachment._id) ? prev : [attachment, ...prev]));
  }, []);

  const value = {
    attachments,
    loading,
    uploading,
    uploadProgress,
    error,
    fetchTaskAttachments,
    uploadToTask,
    removeAttachment,
    applyRealtimeAttachment
  };

  return <AttachmentContext.Provider value={value}>{children}</AttachmentContext.Provider>;
}
