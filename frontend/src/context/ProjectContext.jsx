import { createContext, useState, useCallback } from 'react';
import * as projectApi from '../modules/project/projectApi';

export const ProjectContext = createContext(null);

const uniqueProjects = (projects) => [...new Map(projects.map((project) => [project._id, project])).values()];

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  // Role w.r.t. the CURRENT project's parent workspace — returned directly by the backend
  const [myWorkspaceRole, setMyWorkspaceRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWorkspaceProjects = useCallback(async (workspaceId) => {
    setLoading(true);
    setError('');
    try {
      const res = await projectApi.getWorkspaceProjects(workspaceId);
      setProjects(uniqueProjects(res.data.projects));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (workspaceId, payload) => {
    const res = await projectApi.createProject(workspaceId, payload);
    setProjects((prev) => uniqueProjects([res.data.project, ...prev]));
    return res.data.project;
  }, []);

  const selectProject = useCallback(async (projectId) => {
    setLoading(true);
    setError('');
    try {
      const res = await projectApi.getProjectById(projectId);
      setCurrentProject(res.data.project);
      setMyWorkspaceRole(res.data.myWorkspaceRole);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (projectId, payload) => {
    const res = await projectApi.updateProject(projectId, payload);
    setCurrentProject(res.data.project);
    return res.data.project;
  }, []);

  const archiveProject = useCallback(async (projectId) => {
    await projectApi.archiveProject(projectId);
    setProjects((prev) => prev.filter((p) => p._id !== projectId));
    setCurrentProject(null);
  }, []);

  // Re-fetches project detail after add/remove so members[] always reflects latest server state
  const addProjectMember = useCallback(
    async (projectId, userId) => {
      const res = await projectApi.addProjectMember(projectId, userId);
      await selectProject(projectId);
      return res.data;
    },
    [selectProject]
  );

  const removeProjectMember = useCallback(
    async (projectId, targetUserId) => {
      await projectApi.removeProjectMember(projectId, targetUserId);
      await selectProject(projectId);
    },
    [selectProject]
  );

  const value = {
    projects,
    currentProject,
    myWorkspaceRole,
    loading,
    error,
    fetchWorkspaceProjects,
    createProject,
    selectProject,
    updateProject,
    archiveProject,
    addProjectMember,
    removeProjectMember
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
