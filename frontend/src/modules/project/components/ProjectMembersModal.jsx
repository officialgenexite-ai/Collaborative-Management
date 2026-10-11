export default function ProjectMembersModal({ open, onClose, project, workspaceMembers, onAdd, onRemove }) {
  if (!open) return null;

  const projectMemberIds = new Set(
    (project.members || []).map((m) => (m.userId._id || m.userId).toString())
  );

  const currentMembers = project.members || [];
  const availableMembers = (workspaceMembers || []).filter(
    (m) => !projectMemberIds.has((m.userId._id || m.userId).toString())
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Project Access</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
            Close
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-2">
          {project.members?.length === 0
            ? 'Open to all workspace Members. Add specific people below to also grant Guest access.'
            : 'Only people listed below (plus Owner/Admin) can access this project.'}
        </p>

        <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">In this project</h4>
        {currentMembers.length === 0 && (
          <p className="text-xs text-gray-400 mb-3">No one explicitly added yet.</p>
        )}
        {currentMembers.map((m) => {
          const user = m.userId;
          const userId = user._id || user;
          return (
            <div key={userId} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-900">{user.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={() => onRemove(userId)}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          );
        })}

        <h4 className="text-sm font-semibold text-gray-700 mt-5 mb-2">Add from workspace</h4>
        {availableMembers.length === 0 && (
          <p className="text-xs text-gray-400">Everyone is already added.</p>
        )}
        {availableMembers.map((m) => {
          const user = m.userId;
          const userId = user._id || user;
          return (
            <div key={userId} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-900">{user.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">
                  {user.email} · {m.role}
                </p>
              </div>
              <button
                onClick={() => onAdd(userId)}
                className="text-xs text-primary hover:text-primary-dark font-medium"
              >
                Add
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
