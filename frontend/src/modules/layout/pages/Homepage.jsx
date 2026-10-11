import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useNav } from '../../../hooks/useNav';

export default function HomePage() {
  const { user } = useAuth();
  const { activeWorkspace, projects } = useNav();

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome back, {user?.name}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {activeWorkspace ? `You're in "${activeWorkspace.name}"` : 'Select a workspace from the top bar'}
      </p>

      {activeWorkspace && (
        <>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Your Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((p) => (
              <Link
                key={p._id}
                to={`/projects/${p._id}/tasks`}
                className="block bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md"
              >
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500 mt-1">{p.description || 'No description'}</p>
              </Link>
            ))}
            {projects.length === 0 && <p className="text-sm text-gray-400">No projects yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}
