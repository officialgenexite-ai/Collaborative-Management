function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function TimeLogList({ logs, totalSeconds }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">
        Total logged: <span className="font-semibold text-gray-700">{formatDuration(totalSeconds)}</span>
      </p>
      {logs.length === 0 ? (
        <p className="text-xs text-gray-400">No time logged yet</p>
      ) : (
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {logs.map((log) => (
            <div key={log._id} className="flex items-center justify-between text-xs text-gray-600">
              <span>{log.userId?.name || 'Unknown'}</span>
              <span>{formatDuration(log.durationSeconds)}</span>
              <span className="text-gray-400">{new Date(log.startTime).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
