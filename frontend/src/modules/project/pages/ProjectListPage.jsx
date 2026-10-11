import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProject } from '../../../hooks/useProject';
import { useWorkspace } from '../../../hooks/useWorkspace';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';

export default function ProjectListPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace, myRole, selectWorkspace } = useWorkspace();
  const { projects, loading, error, fetchWorkspaceProjects, createProject } = useProject();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    selectWorkspace(workspaceId);
    fetchWorkspaceProjects(workspaceId);
  }, [workspaceId, selectWorkspace, fetchWorkspaceProjects]);

  const canCreate = myRole === 'Owner' || myRole === 'Admin';

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <Link to={`/workspaces/${workspaceId}`} className="text-sm text-primary font-medium">
          &larr; Back to workspace
        </Link>

        <div className="flex items-center justify-between mt-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentWorkspace?.name || 'Workspace'} — Projects
            </h1>
            <p className="text-sm text-gray-500">Organize work into focused projects</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setModalOpen(true)}
              className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              + New Project
            </button>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-400">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No projects yet in this workspace.</p>
            {canCreate && (
              <button
                onClick={() => setModalOpen(true)}
                className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p._id} project={p} onClick={() => navigate(`/projects/${p._id}/tasks`)} />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(payload) => createProject(workspaceId, payload)}
      />
    </div>
  );
}
