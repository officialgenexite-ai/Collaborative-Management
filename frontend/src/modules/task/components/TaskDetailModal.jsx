import { useEffect, useState } from 'react';
import { useTask } from '../../../hooks/useTask';
import CommentThread from '../../comment/components/CommentThread';
import { useAttachment } from '../../../hooks/useAttachment';
import AttachmentUploader from '../../attachment/components/AttachmentUploader';
import AttachmentList from '../../attachment/components/AttachmentList';

// Added Time Tracking Imports
import { useTimeTracking } from '../../../hooks/useTimeTracking';
import TimerButton from '../../timetracking/components/TimerButton';
import TimeLogList from '../../timetracking/components/TimeLogList';
import EstimateEditor from '../../timetracking/components/EstimateEditor';
import * as aiApi from '../../ai/aiApi';

const STATUS_OPTIONS = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

export default function TaskDetailModal({ taskId, open, onClose, workspaceMembers, myWorkspaceRole, currentUserId }) {
  const { currentTask, selectTask, updateTaskDetails, changeTaskStatus, changeTaskAssignees, removeTask } = useTask();
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [priorityDraft, setPriorityDraft] = useState('Medium');
  const { attachments, fetchTaskAttachments, removeAttachment } = useAttachment();
  
  // Added Time Tracking Hook
  const { taskLogs, totalSeconds, fetchTaskLogs } = useTimeTracking();
  
  const [error, setError] = useState('');
  
  // AI Summary State
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    if (open && taskId) {
      selectTask(taskId);
      fetchTaskAttachments(taskId);
      fetchTaskLogs(taskId); // Added fetchTaskLogs
      setEditing(false);
      setError('');
      setSummary(''); // Reset summary when opening a new task
    }
  }, [open, taskId, selectTask, fetchTaskAttachments, fetchTaskLogs]); // Added fetchTaskLogs to deps

  useEffect(() => {
    if (currentTask) {
      setTitleDraft(currentTask.title);
      setDescDraft(currentTask.description || '');
      setPriorityDraft(currentTask.priority);
    }
  }, [currentTask]);

  if (!open || !currentTask) return null;

  // Mirrors the backend's exact permission rules — see requireTaskManagePermission
  // and requireStatusUpdatePermission in taskAccessMiddleware.js
  const isOwnerOrAdmin = myWorkspaceRole === 'Owner' || myWorkspaceRole === 'Admin';
  const isCreator = (currentTask.createdBy?._id || currentTask.createdBy) === currentUserId;
  const isAssignee = (currentTask.assignees || []).some((a) => (a._id || a) === currentUserId);

  const canManage = isOwnerOrAdmin || isCreator; // full edit + delete
  const canChangeStatus = isOwnerOrAdmin || isAssignee;
  const canReassign = myWorkspaceRole !== 'Guest';

  const handleSave = async () => {
    setError('');
    try {
      await updateTaskDetails(taskId, { title: titleDraft, description: descDraft, priority: priorityDraft });
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleStatusChange = async (status) => {
    setError('');
    try {
      await changeTaskStatus(taskId, status);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const toggleAssignee = async (userId) => {
    setError('');
    const current = (currentTask.assignees || []).map((a) => a._id || a);
    const updated = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    try {
      await changeTaskAssignees(taskId, updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update assignees');
    }
  };

  const handleDelete = async () => {
    try {
      await removeTask(taskId);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          {editing ? (
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="text-lg font-bold border border-gray-300 rounded-lg px-2 py-1 w-full mr-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <h3 className="text-lg font-bold text-gray-900">{currentTask.title}</h3>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm shrink-0">
            Close
          </button>
        </div>

        {editing ? (
          <textarea
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            rows={3}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <p className="text-sm text-gray-500 mb-4">{currentTask.description || 'No description'}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            {canChangeStatus ? (
              <select
                value={currentTask.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-700">{currentTask.status}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Priority</p>
            {editing && canManage ? (
              <select
                value={priorityDraft}
                onChange={(e) => setPriorityDraft(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-medium text-gray-700">{currentTask.priority}</p>
            )}
          </div>
        </div>

        {/* Added Estimate Editor and Timer Button block */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          <EstimateEditor
            taskId={taskId}
            estimatedMinutes={currentTask.estimatedMinutes}
            canEdit={canManage}
          />
          <TimerButton taskId={taskId} />
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Assignees</p>
          {canReassign ? (
            <div className="max-h-28 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {workspaceMembers.map((m) => {
                const u = m.userId;
                const uid = u._id || u;
                const checked = (currentTask.assignees || []).some((a) => (a._id || a) === uid);
                return (
                  <label key={uid} className="flex items-center gap-2 py-1 text-sm text-gray-700">
                    <input type="checkbox" checked={checked} onChange={() => toggleAssignee(uid)} />
                    {u.name || 'Unknown'}
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-700">
              {(currentTask.assignees || []).map((a) => a.name).join(', ') || 'Unassigned'}
            </p>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        
        {/* AI Summary Block */}
        <div className="mb-4">
          <button
            onClick={async () => {
              setSummarizing(true);
              try {
                const res = await aiApi.getTaskSummary(taskId);
                setSummary(res.data.summary);
              } finally {
                setSummarizing(false);
              }
            }}
            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-3 py-1.5 rounded-lg"
          >
            {summarizing ? 'Summarizing...' : '🤖 AI Summary'}
          </button>
          {summary && <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg">{summary}</p>}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">Attachments</p>
            <AttachmentUploader taskId={taskId} />
          </div>
          <AttachmentList
            attachments={attachments}
            currentUserId={currentUserId}
            myWorkspaceRole={myWorkspaceRole}
            onDelete={removeAttachment}
          />
        </div>

        {/* Added Time Log List block */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Time Logs</p>
          <TimeLogList logs={taskLogs} totalSeconds={totalSeconds} />
        </div>

        <CommentThread taskId={taskId} currentUserId={currentUserId} myWorkspaceRole={myWorkspaceRole} />

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            {canManage && !editing && (
              <button onClick={() => setEditing(true)} className="text-sm text-primary font-medium">
                Edit
              </button>
            )}
            {editing && (
              <>
                <button
                  onClick={handleSave}
                  className="text-sm bg-primary hover:bg-primary-dark text-white font-semibold px-3 py-1.5 rounded-lg"
                >
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="text-sm text-gray-500 px-3 py-1.5">
                  Cancel
                </button>
              </>
            )}
          </div>
          {canManage && (
            <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700 font-medium">
              Delete Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
