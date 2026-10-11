import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as timeTrackingApi from '../timeTrackingApi';

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export default function TimesheetPage() {
  const [startDate, setStartDate] = useState(todayISO(-6));
  const [endDate, setEndDate] = useState(todayISO());
  const [logs, setLogs] = useState([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const res = await timeTrackingApi.getMyTimesheet(startDate, endDate);
      setLogs(res.data.logs);
      setTotalSeconds(res.data.totalSeconds);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/workspaces" className="text-sm text-primary font-medium">
          &larr; Back
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">My Timesheet</h1>

          <div className="flex items-end gap-3 mb-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleFetch}
              className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Load
            </button>
          </div>

          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Total: <span className="font-semibold">{formatDuration(totalSeconds)}</span>
              </p>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-400">No entries in this range</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2">Task</th>
                      <th className="py-2">Date</th>
                      <th className="py-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b border-gray-50">
                        <td className="py-2 text-gray-800">{log.taskId?.title || 'Unknown task'}</td>
                        <td className="py-2 text-gray-500">{new Date(log.startTime).toLocaleDateString()}</td>
                        <td className="py-2 text-gray-700">{formatDuration(log.durationSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
