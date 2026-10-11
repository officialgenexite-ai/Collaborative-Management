import { createContext, useState, useCallback } from 'react';
import * as automationApi from '../modules/automation/automationApi';

export const AutomationContext = createContext(null);

export function AutomationProvider({ children }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRules = useCallback(async (projectId) => {
    setLoading(true);
    setError('');
    try {
      const res = await automationApi.getProjectRules(projectId);
      setRules(res.data.rules);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load automations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRule = useCallback(async (projectId, payload) => {
    const res = await automationApi.createRule(projectId, payload);
    setRules((prev) => [res.data.rule, ...prev]);
    return res.data.rule;
  }, []);

  const toggleRule = useCallback(async (projectId, ruleId) => {
    const res = await automationApi.toggleRule(projectId, ruleId);
    setRules((prev) => prev.map((r) => (r._id === ruleId ? res.data.rule : r)));
  }, []);

  const removeRule = useCallback(async (projectId, ruleId) => {
    await automationApi.deleteRule(projectId, ruleId);
    setRules((prev) => prev.filter((r) => r._id !== ruleId));
  }, []);

  const value = { rules, loading, error, fetchRules, createRule, toggleRule, removeRule };

  return <AutomationContext.Provider value={value}>{children}</AutomationContext.Provider>;
}
