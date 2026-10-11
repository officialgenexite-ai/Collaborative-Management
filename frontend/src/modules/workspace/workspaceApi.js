import axiosInstance from '../../api/axiosInstance';

export const createWorkspace = (payload) => axiosInstance.post('/workspaces', payload);

export const getMyWorkspaces = () => axiosInstance.get('/workspaces');

export const getWorkspaceById = (workspaceId) => axiosInstance.get(`/workspaces/${workspaceId}`);

export const updateWorkspace = (workspaceId, payload) =>
  axiosInstance.patch(`/workspaces/${workspaceId}`, payload);

export const archiveWorkspace = (workspaceId) => axiosInstance.delete(`/workspaces/${workspaceId}`);

export const inviteMember = (workspaceId, payload) =>
  axiosInstance.post(`/workspaces/${workspaceId}/invite`, payload);

export const changeMemberRole = (workspaceId, targetUserId, newRole) =>
  axiosInstance.patch(`/workspaces/${workspaceId}/members/${targetUserId}`, { newRole });

export const removeMember = (workspaceId, targetUserId) =>
  axiosInstance.delete(`/workspaces/${workspaceId}/members/${targetUserId}`);
