import { useState } from 'react';

const STATUS_OPTIONS = ['To Do', 'In Progress', 'In Review', 'Done'];
const TRIGGER_OPTIONS = [
  { value: 'status_change', label: 'Status changes' },
  { value: 'task_assigned', label: 'Task is assigned' }
];
const ACTION_OPTIONS = [
  { value: 'send_notification', label: 'Send notification' },
  { value: 'change_status', label: 'Change status' },
  { value: 'assign_user', label: 'Assign user' }
];

const emptyAction = () => ({
  type: 'send_notification',
  targetType: 'creator',
  message: '',
  newStatus: 'Done',
  userId: ''
});

export default function RuleBuilder({ open, onClose, onCreate, workspaceMembers }) {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('status_change');
  const [triggerValue, setTriggerValue] = useState('Done');
  const [actions, setActions] = useState([emptyAction()]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const updateAction = (index, patch) => {
    setActions((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  };

  const addAction = () => setActions((prev) => [...prev, emptyAction()]);
  const removeAction = (index) => setActions((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Rule name is required');
      return;
    }

    const trigger = {
      type: triggerType,
      conditions:
        triggerType === 'status_change'
          ? [{ field: 'status', operator: 'equals', value: triggerValue }]
          : []
    };

    const builtActions = actions.map((a) => {
      if (a.type === 'send_notification') {
        return { type: 'send_notification', params: { targetType: a.targetType, message: a.message } };
      }
      if (a.type === 'change_status') {
        return { type: 'change_status', params: { newStatus: a.newStatus } };
      }
      return { type: 'assign_user', params: { userId: a.userId } };
    });

    setSubmitting(true);
    try {
      await onCreate({ name: name.trim(), trigger, actions: builtActions });
      setName('');
      setActions([emptyAction()]);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create rule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">New Automation</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Rule name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <p className="text-xs text-gray-500 mb-1">When...</p>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {TRIGGER_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {triggerType === 'status_change' && (
            <select
              value={triggerValue}
              onChange={(e) => setTriggerValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>changes to "{s}"</option>
              ))}
            </select>
          )}

          <p className="text-xs text-gray-500 mb-2">Then...</p>
          {actions.map((action, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 mb-2">
              <div className="flex items-center justify-between mb-2">
                <select
                  value={action.type}
                  onChange={(e) => updateAction(index, { type: e.target.value })}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 flex-1 mr-2"
                >
                  {ACTION_OPTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
                {actions.length > 1 && (
                  <button type="button" onClick={() => removeAction(index)} className="text-red-500 text-xs">
                    Remove
                  </button>
                )}
              </div>

              {action.type === 'send_notification' && (
                <>
                  <select
                    value={action.targetType}
                    onChange={(e) => updateAction(index, { targetType: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 mb-2"
                  >
                    <option value="creator">Notify task creator</option>
                    <option value="assignees">Notify assignees</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Message (optional)"
                    value={action.message}
                    onChange={(e) => updateAction(index, { message: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                  />
                </>
              )}

              {action.type === 'change_status' && (
                <select
                  value={action.newStatus}
                  onChange={(e) => updateAction(index, { newStatus: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}

              {action.type === 'assign_user' && (
                <select
                  value={action.userId}
                  onChange={(e) => updateAction(index, { userId: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="">Select a member</option>
                  {workspaceMembers.map((m) => {
                    const u = m.userId;
                    const uid = u._id || u;
                    return (
                      <option key={uid} value={uid}>{u.name || 'Unknown'}</option>
                    );
                  })}
                </select>
              )}
            </div>
          ))}

          <button type="button" onClick={addAction} className="text-xs text-primary font-medium mb-4">
            + Add another action
          </button>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary-dark text-white disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
