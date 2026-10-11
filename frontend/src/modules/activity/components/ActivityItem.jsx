function formatActivity({ action, meta }) {
  switch (action) {
    case 'task_created':
      return 'created this task';
    case 'task_updated':
      return `updated ${meta?.fields?.length ? meta.fields.join(', ') : 'the task'}`;
    case 'status_changed':
      return `changed status from "${meta?.from}" to "${meta?.to}"`;
    case 'assignees_updated':
      return 'updated the assignees';
    case 'task_deleted':
      return 'deleted this task';
    case 'project_created':
      return 'created this project';
    case 'project_updated':
      return `updated the project (${meta?.fields?.join(', ') || '...'})`;
    case 'project_archived':
      return 'archived this project';
    default:
      return action.replace(/_/g, ' ');
  }
}

export default function ActivityItem({ entry }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs shrink-0">
        ⚙️
      </span>
      <p className="text-xs text-gray-500">
        <span className="font-medium text-gray-600">{entry.userId?.name || 'Someone'}</span>{' '}
        {formatActivity(entry)}
        <span className="text-gray-400"> · {new Date(entry.createdAt).toLocaleString()}</span>
      </p>
    </div>
  );
}
