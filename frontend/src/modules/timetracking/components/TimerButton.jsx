import { useTimeTracking } from '../../../hooks/useTimeTracking';

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function TimerButton({ taskId }) {
  const { activeTimer, elapsedSeconds, startTimer, stopTimer } = useTimeTracking();

  const isRunningHere = activeTimer && (activeTimer.taskId?._id || activeTimer.taskId) === taskId;
  const isRunningElsewhere = activeTimer && !isRunningHere;

  const handleClick = async () => {
    if (isRunningHere) {
      await stopTimer(taskId);
    } else {
      await startTimer(taskId);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
          isRunningHere ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary hover:bg-primary-dark text-white'
        }`}
      >
        {isRunningHere ? `⏹ Stop ${formatDuration(elapsedSeconds)}` : '▶ Start Timer'}
      </button>
      {isRunningElsewhere && (
        <span className="text-[11px] text-gray-400">
          Running on "{activeTimer.taskId?.title || 'another task'}"
        </span>
      )}
    </div>
  );
}
