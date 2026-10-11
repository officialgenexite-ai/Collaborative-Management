import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../../hooks/useWorkspace';
import WorkspaceCard from '../components/WorkspaceCard';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';

export default function WorkspaceListPage() {
  const navigate = useNavigate();
  const { workspaces, loading, error, fetchWorkspaces, createWorkspace } = useWorkspace();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-primary">Workspace hub</p>
            <h1 className="text-2xl font-bold text-gray-900">Your workspaces</h1>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            + New Workspace
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-400">Loading workspaces...</p>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">You have no workspaces yet.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Create your first workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace._id}
                workspace={workspace}
                onClick={() => navigate(`/workspaces/${workspace._id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={(payload) => createWorkspace(payload)}
      />
    </div>
  );
}
