import RoleBadge from '../../../components/RoleBadge';

export default function WorkspaceCard({ workspace, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl shadow-sm hover:shadow-md transition p-5 border border-gray-100 w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{workspace.name}</h3>
        {workspace.myRole && <RoleBadge role={workspace.myRole} />}
      </div>
      <p className="text-sm text-gray-500 line-clamp-2">
        {workspace.description || 'No description'}
      </p>
      <p className="text-xs text-gray-400 mt-3">{workspace.members?.length || 0} member(s)</p>
    </button>
  );
}
