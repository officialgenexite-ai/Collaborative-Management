import { createContext, useState, useCallback, useEffect, useRef } from 'react';
import * as timeTrackingApi from '../modules/timetracking/timeTrackingApi';

export const TimeTrackingContext = createContext(null);

export function TimeTrackingProvider({ children }) {
  const [activeTimer, setActiveTimer] = useState(null); // { _id, taskId: {_id,title,projectId}, startTime }
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [taskLogs, setTaskLogs] = useState([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const tickRef = useRef(null);

  const fetchActiveTimer = useCallback(async () => {
    try {
      const res = await timeTrackingApi.getActiveTimer();
      setActiveTimer(res.data.timeLog);
    } catch (err) {
      // silent
    }
  }, []);

  // Local ticking clock — recomputed from startTime each tick, so it stays
  // correct even if the tab was backgrounded/throttled for a while.
  useEffect(() => {
    clearInterval(tickRef.current);
    if (activeTimer) {
      const update = () => {
        setElapsedSeconds(Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000));
      };
      update();
      tickRef.current = setInterval(update, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(tickRef.current);
  }, [activeTimer]);

  const startTimer = useCallback(async (taskId) => {
    const res = await timeTrackingApi.startTimer(taskId);
    setActiveTimer({ ...res.data.timeLog, taskId: { _id: taskId } });
    return res.data.timeLog;
  }, []);

  const stopTimer = useCallback(async (taskId) => {
    const res = await timeTrackingApi.stopTimer(taskId);
    setActiveTimer(null);
    setTaskLogs((prev) => [res.data.timeLog, ...prev]);
    setTotalSeconds((prev) => prev + res.data.timeLog.durationSeconds);
    return res.data.timeLog;
  }, []);

  const fetchTaskLogs = useCallback(async (taskId) => {
    setLoading(true);
    try {
      const res = await timeTrackingApi.getTaskTimeLogs(taskId);
      setTaskLogs(res.data.logs);
      setTotalSeconds(res.data.totalSeconds);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEstimate = useCallback(async (taskId, estimatedMinutes) => {
    const res = await timeTrackingApi.updateEstimate(taskId, estimatedMinutes);
    return res.data.task;
  }, []);

  const value = {
    activeTimer,
    elapsedSeconds,
    taskLogs,
    totalSeconds,
    loading,
    fetchActiveTimer,
    startTimer,
    stopTimer,
    fetchTaskLogs,
    updateEstimate
  };

  return <TimeTrackingContext.Provider value={value}>{children}</TimeTrackingContext.Provider>;
}
