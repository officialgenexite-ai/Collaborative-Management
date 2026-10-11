function describeTrigger(trigger) {
  if (trigger.type === 'status_change') {
    const cond = trigger.conditions?.[0];
    return `Status changes to "${cond?.value || '...'}"`;
  }
  if (trigger.type === 'task_assigned') return 'Task is assigned';
  return trigger.type;
}

function describeAction(action) {
  if (action.type === 'send_notification') return `Notify ${action.params?.targetType || '...'}`;
  if (action.type === 'change_status') return `Change status to "${action.params?.newStatus}"`;
  if (action.type === 'assign_user') return 'Assign a user';
  return action.type;
}

export default function RuleList({ rules, onToggle, onDelete }) {
  if (rules.length === 0) {
    return <p className="text-sm text-gray-400">No automations yet.</p>;
  }

  return (
    <div className="space-y-2">
      {rules.map((rule) => (
        <div key={rule._id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">{rule.name}</h4>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggle(rule._id)}
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {rule.isActive ? 'Active' : 'Inactive'}
              </button>
              <button onClick={() => onDelete(rule._id)} className="text-xs text-red-500 hover:text-red-700">
                Delete
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            <span className="font-medium">When:</span> {describeTrigger(rule.trigger)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-medium">Then:</span> {rule.actions.map(describeAction).join(', ')}
          </p>
        </div>
      ))}
    </div>
  );
}
