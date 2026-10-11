import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimeTracking } from '../../../hooks/useTimeTracking';

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function ActiveTimerWidget() {
  const navigate = useNavigate();
  const { activeTimer, elapsedSeconds, fetchActiveTimer, stopTimer } = useTimeTracking();

  useEffect(() => {
    fetchActiveTimer();
  }, [fetchActiveTimer]);

  if (!activeTimer) return null;

  const task = activeTimer.taskId;

  const handleStop = async (e) => {
    e.stopPropagation();
    await stopTimer(task._id || task);
  };

  const handleOpenTask = () => {
    if (task?.projectId) navigate(`/projects/${task.projectId}/tasks`);
  };

  return (
    <div
      onClick={handleOpenTask}
      className="fixed bottom-4 right-4 z-40 bg-gray-900 text-white rounded-full pl-4 pr-2 py-2 shadow-lg flex items-center gap-3 cursor-pointer"
    >
      <span className="text-xs">
        ⏱ {task?.title || 'Task'} · <span className="font-mono">{formatDuration(elapsedSeconds)}</span>
      </span>
      <button
        onClick={handleStop}
        className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full"
      >
        Stop
      </button>
    </div>
  );
}
