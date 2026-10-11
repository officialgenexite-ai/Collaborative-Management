

import { createContext, useState, useCallback } from 'react';
import * as taskApi from '../modules/task/taskApi';

export const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProjectTasks = useCallback(async (projectId) => {
    setLoading(true);
    setError('');
    try {
      const res = await taskApi.getProjectTasks(projectId);
      setTasks(res.data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (projectId, payload) => {
    const res = await taskApi.createTask(projectId, payload);
    setTasks((prev) => [...prev, res.data.task]);
    return res.data.task;
  }, []);

  const selectTask = useCallback(async (taskId) => {
    setLoading(true);
    setError('');
    try {
      const res = await taskApi.getTaskById(taskId);
      setCurrentTask(res.data.task);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskDetails = useCallback(async (taskId, payload) => {
    const res = await taskApi.updateTask(taskId, payload);
    setCurrentTask(res.data.task);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
    return res.data.task;
  }, []);

  const changeTaskStatus = useCallback(async (taskId, status) => {
    const res = await taskApi.updateTaskStatus(taskId, status);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
    setCurrentTask((prev) => (prev && prev._id === taskId ? res.data.task : prev));
    return res.data.task;
  }, []);

  const changeTaskAssignees = useCallback(async (taskId, assigneeIds) => {
    const res = await taskApi.assignTask(taskId, assigneeIds);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
    setCurrentTask((prev) => (prev && prev._id === taskId ? res.data.task : prev));
    return res.data.task;
  }, []);


const changeTaskOrder = useCallback(async (taskId, newOrder) => {
  const res = await taskApi.reorderTask(taskId, newOrder);
  setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
  return res.data.task;
}, []);


  const removeTask = useCallback(async (taskId) => {
    await taskApi.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    setCurrentTask(null);
  }, []);

  const applyRealtimeTaskEvent = useCallback((eventName, payload) => {
    if (!payload) return;

    if (eventName === 'task:created') {
      setTasks((prev) => {
        if (prev.some((task) => task._id === payload._id)) return prev;
        return [...prev, payload];
      });
      return;
    }

    if (eventName === 'task:updated') {
      setTasks((prev) => prev.map((task) => (task._id === payload._id ? payload : task)));
      setCurrentTask((prev) => (prev && prev._id === payload._id ? payload : prev));
      return;
    }

    if (eventName === 'task:deleted') {
      const taskId = payload?.taskId || payload?._id;
      if (!taskId) return;
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      setCurrentTask((prev) => (prev && prev._id === taskId ? null : prev));
    }
  }, []);

  const value = {
    tasks,
    currentTask,
    loading,
    error,
    fetchProjectTasks,
    createTask,
    selectTask,
    updateTaskDetails,
    changeTaskStatus,
    changeTaskAssignees,
    changeTaskOrder,
    removeTask,
    applyRealtimeTaskEvent
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}


