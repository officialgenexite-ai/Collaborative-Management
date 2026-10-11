import { useNavigate } from 'react-router-dom';
import { useNav } from '../../../hooks/useNav';

export default function ProjectTreePanel() {
  const navigate = useNavigate();
  const { activeWorkspace, projects, loading } = useNav();

  if (!activeWorkspace) return null;

  return (
    <div className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs text-gray-400">Workspace</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{activeWorkspace.name}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <button
          onClick={() => navigate(`/workspaces/${activeWorkspace._id}/projects`)}
          className="w-full text-left text-xs text-primary font-medium px-2 py-1.5 mb-1 hover:bg-gray-50 rounded-lg"
        >
          View all projects
        </button>
        {loading && <p className="text-xs text-gray-400 px-2">Loading...</p>}
        {!loading && projects.length === 0 && <p className="text-xs text-gray-400 px-2">No projects yet</p>}
        {projects.map((p) => (
          <button
            key={p._id}
            onClick={() => navigate(`/projects/${p._id}/tasks`)}
            className="w-full flex items-center gap-2 text-left text-sm text-gray-700 px-2 py-1.5 hover:bg-gray-50 rounded-lg"
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || '#4f46e5' }} />
            <span className="truncate">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
