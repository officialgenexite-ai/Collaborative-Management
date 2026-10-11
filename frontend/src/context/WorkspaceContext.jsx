import { createContext, useState, useCallback } from 'react';
import * as workspaceApi from '../modules/workspace/workspaceApi';

export const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await workspaceApi.getMyWorkspaces();
      setWorkspaces(res.data.workspaces);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkspace = useCallback(async (payload) => {
    const res = await workspaceApi.createWorkspace(payload);
    setWorkspaces((prev) => [res.data.workspace, ...prev]);
    return res.data.workspace;
  }, []);

  const selectWorkspace = useCallback(async (workspaceId) => {
    setLoading(true);
    setError('');
    try {
      const res = await workspaceApi.getWorkspaceById(workspaceId);
      setCurrentWorkspace(res.data.workspace);
      setMyRole(res.data.myRole);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWorkspace = useCallback(async (workspaceId, payload) => {
    const res = await workspaceApi.updateWorkspace(workspaceId, payload);
    setCurrentWorkspace(res.data.workspace);
    return res.data.workspace;
  }, []);

  // Re-fetches workspace detail after invite/role-change/remove so the
  // members list + roles always reflect the latest server state.
  const inviteMember = useCallback(
    async (workspaceId, payload) => {
      const res = await workspaceApi.inviteMember(workspaceId, payload);
      await selectWorkspace(workspaceId);
      return res.data;
    },
    [selectWorkspace]
  );

  const changeMemberRole = useCallback(
    async (workspaceId, targetUserId, newRole) => {
      await workspaceApi.changeMemberRole(workspaceId, targetUserId, newRole);
      await selectWorkspace(workspaceId);
    },
    [selectWorkspace]
  );

  const removeMember = useCallback(
    async (workspaceId, targetUserId) => {
      await workspaceApi.removeMember(workspaceId, targetUserId);
      await selectWorkspace(workspaceId);
    },
    [selectWorkspace]
  );

  const archiveWorkspace = useCallback(async (workspaceId) => {
    await workspaceApi.archiveWorkspace(workspaceId);
    setWorkspaces((prev) => prev.filter((w) => w._id !== workspaceId));
    setCurrentWorkspace(null);
  }, []);

  const value = {
    workspaces,
    currentWorkspace,
    myRole,
    loading,
    error,
    fetchWorkspaces,
    createWorkspace,
    selectWorkspace,
    updateWorkspace,
    inviteMember,
    changeMemberRole,
    removeMember,
    archiveWorkspace
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
