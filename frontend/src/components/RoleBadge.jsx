const ROLE_COLORS = {
  Owner: 'bg-purple-100 text-purple-700',
  Admin: 'bg-blue-100 text-blue-700',
  Member: 'bg-green-100 text-green-700',
  Guest: 'bg-gray-100 text-gray-600'
};

export default function RoleBadge({ role }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600'}`}>
      {role}
    </span>
  );
}
