import axiosInstance from '../../api/axiosInstance';

export const createRule = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/automations`, payload);

export const getProjectRules = (projectId) => axiosInstance.get(`/projects/${projectId}/automations`);

export const toggleRule = (projectId, ruleId) =>
  axiosInstance.patch(`/projects/${projectId}/automations/${ruleId}/toggle`);

export const updateRule = (projectId, ruleId, payload) =>
  axiosInstance.patch(`/projects/${projectId}/automations/${ruleId}`, payload);

export const deleteRule = (projectId, ruleId) =>
  axiosInstance.delete(`/projects/${projectId}/automations/${ruleId}`);
