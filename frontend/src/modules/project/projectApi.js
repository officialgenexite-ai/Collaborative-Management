import axiosInstance from '../../api/axiosInstance';

export const createProject = (workspaceId, payload) =>
  axiosInstance.post(`/workspaces/${workspaceId}/projects`, payload);

export const getWorkspaceProjects = (workspaceId) =>
  axiosInstance.get(`/workspaces/${workspaceId}/projects`);

export const getProjectById = (projectId) => axiosInstance.get(`/projects/${projectId}`);

export const updateProject = (projectId, payload) =>
  axiosInstance.patch(`/projects/${projectId}`, payload);

export const archiveProject = (projectId) => axiosInstance.delete(`/projects/${projectId}`);

export const addProjectMember = (projectId, userId) =>
  axiosInstance.post(`/projects/${projectId}/members`, { userId });

export const removeProjectMember = (projectId, targetUserId) =>
  axiosInstance.delete(`/projects/${projectId}/members/${targetUserId}`);
