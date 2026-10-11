import { useState } from 'react';
import * as aiApi from '../aiApi';

export default function ImageUploadButton({ projectId, onExtracted }) {
  const [busy, setBusy] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      const res = await aiApi.sendImageCommand(projectId, file);
      onExtracted(res.data.extracted);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <input type="file" accept="image/*" onChange={handleChange} className="hidden" id="ai-image-input" />
      <label
        htmlFor="ai-image-input"
        className="px-3 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
        title="Extract a task from an image"
      >
        {busy ? '...' : '🖼️'}
      </label>
    </>
  );
}
