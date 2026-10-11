import { createContext, useState, useCallback } from 'react';
import * as activityApi from '../modules/activity/activityApi';

export const ActivityContext = createContext(null);

export function ActivityProvider({ children }) {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTaskActivity = useCallback(async (taskId) => {
    setLoading(true);
    try {
      const res = await activityApi.getTaskActivity(taskId);
      setActivity(res.data.activity);
    } catch (err) {
      // silent — the activity feed is supplementary, shouldn't block the modal
    } finally {
      setLoading(false);
    }
  }, []);

  const applyRealtimeActivity = useCallback((entry) => {
    setActivity((prev) => (prev.some((a) => a._id === entry._id) ? prev : [entry, ...prev]));
  }, []);

  const value = { activity, loading, fetchTaskActivity, applyRealtimeActivity };

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}
