import { useAttachment } from '../../../hooks/useAttachment';

export default function AttachmentUploader({ taskId }) {
  const { uploadToTask, uploading, uploadProgress, error } = useAttachment();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadToTask(taskId, file);
    } catch (err) {
      // error already captured in context state
    } finally {
      e.target.value = ''; // allow re-selecting the same file name later
    }
  };

  return (
    <div className="mb-2">
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="hidden"
        id="attachment-upload-input"
      />
      <label
        htmlFor="attachment-upload-input"
        className="inline-block text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg cursor-pointer"
      >
        📎 Attach file
      </label>
      {uploading && <span className="text-xs text-gray-400 ml-2">Uploading... {uploadProgress}%</span>}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
