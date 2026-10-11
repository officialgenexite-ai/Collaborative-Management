const PRIORITY_COLORS = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700'
};

export default function TaskCard({ task, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg shadow-sm hover:shadow-md hover:ring-1 hover:ring-white/80 transition-all duration-150 p-3 border border-gray-100"
    >
      <p className="text-sm font-medium text-gray-900 mb-2">{task.title}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium}`}>
          {task.priority}
        </span>
        {task.assignees?.length > 0 && (
          <div className="flex -space-x-2">
            {task.assignees.slice(0, 3).map((a) => (
              <div
                key={a._id || a}
                title={a.name}
                className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold border-2 border-white"
              >
                {a.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            ))}
          </div>
        )}
      </div>
      {task.dueDate && (
        <p className="text-[11px] text-gray-400 mt-2">Due {new Date(task.dueDate).toLocaleDateString()}</p>
      )}
    </button>
  );
}
