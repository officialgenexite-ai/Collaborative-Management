import { createContext, useState, useEffect, useCallback } from 'react';
import * as workspaceApi from '../modules/workspace/workspaceApi';
import * as projectApi from '../modules/project/projectApi';

export const NavContext = createContext(null);

const ACTIVE_WORKSPACE_KEY = 'active_workspace_id';

export function NavProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() =>
    localStorage.getItem(ACTIVE_WORKSPACE_KEY)
  );
  const [projects, setProjects] = useState([]);
  const [treeOpen, setTreeOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const setActiveWorkspace = useCallback((workspaceId) => {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
    setActiveWorkspaceIdState(workspaceId);
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await workspaceApi.getMyWorkspaces();
      setWorkspaces(res.data.workspaces);
      setActiveWorkspaceIdState((current) => {
        if (current) return current;
        return res.data.workspaces[0]?._id || null;
      });
    } catch (err) {
      // silent — the sidebar shouldn't crash the app on a fetch failure
    }
  }, []);

  const fetchProjects = useCallback(async (workspaceId) => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await projectApi.getWorkspaceProjects(workspaceId);
      setProjects(res.data.projects);
    } catch (err) {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lets a page that loads a project directly (e.g. ProjectDetailPage via a
  // deep link) keep the sidebar's active workspace in sync with what's open.
  const syncWorkspaceFromProject = useCallback(
    (workspaceId) => {
      if (workspaceId && workspaceId !== activeWorkspaceId) {
        setActiveWorkspace(workspaceId);
      }
    },
    [activeWorkspaceId, setActiveWorkspace]
  );

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (activeWorkspaceId) fetchProjects(activeWorkspaceId);
  }, [activeWorkspaceId, fetchProjects]);

  const activeWorkspace = workspaces.find((w) => w._id === activeWorkspaceId) || null;

  const value = {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    projects,
    loading,
    treeOpen,
    setTreeOpen,
    setActiveWorkspace,
    syncWorkspaceFromProject,
    refreshProjects: () => fetchProjects(activeWorkspaceId)
  };

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
