import RoleBadge from '../../../components/RoleBadge';

const ROLE_OPTIONS = ['Owner', 'Admin', 'Member', 'Guest'];

export default function MemberRow({ member, canManage, isOwnerViewer, onChangeRole, onRemove }) {
  const user = member.userId; // populated { _id, name, email, avatar }

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{user?.name || 'Unknown user'}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Only Owner can change roles — matches backend requireRole('Owner') */}
        {isOwnerViewer ? (
          <select
            value={member.role}
            onChange={(e) => onChangeRole(user._id, e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        ) : (
          <RoleBadge role={member.role} />
        )}

        {/* Owner or Admin can remove — matches backend requireRole('Owner','Admin') */}
        {canManage && (
          <button
            onClick={() => onRemove(user._id)}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
