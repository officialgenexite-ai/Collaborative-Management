const STATUS_COLORS = {
  Active: 'bg-green-100 text-green-700',
  Completed: 'bg-blue-100 text-blue-700',
  Archived: 'bg-gray-100 text-gray-600'
};

export default function ProjectCard({ project, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl shadow-sm hover:shadow-md transition p-5 border border-gray-100 w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color || '#4f46e5' }} />
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-600'}`}>
          {project.status}
        </span>
      </div>
      <p className="text-sm text-gray-500 line-clamp-2">{project.description || 'No description'}</p>
    </button>
  );
}
