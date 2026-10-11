import { useState } from 'react';
import { useTimeTracking } from '../../../hooks/useTimeTracking';

export default function EstimateEditor({ taskId, estimatedMinutes, canEdit }) {
  const { updateEstimate } = useTimeTracking();
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState(Math.floor((estimatedMinutes || 0) / 60));

  const handleSave = async () => {
    await updateEstimate(taskId, hours * 60);
    setEditing(false);
  };

  if (!canEdit) {
    return (
      <p className="text-xs text-gray-500">
        Estimate: {estimatedMinutes ? `${(estimatedMinutes / 60).toFixed(1)}h` : 'Not set'}
      </p>
    );
  }

  return editing ? (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        step="0.5"
        value={hours}
        onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
        className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
      />
      <span className="text-xs text-gray-500">hours</span>
      <button onClick={handleSave} className="text-xs text-primary font-medium">
        Save
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-gray-400">
        Cancel
      </button>
    </div>
  ) : (
    <button onClick={() => setEditing(true)} className="text-xs text-gray-500 hover:text-primary">
      Estimate: {estimatedMinutes ? `${(estimatedMinutes / 60).toFixed(1)}h` : 'Set estimate'}
    </button>
  );
}
