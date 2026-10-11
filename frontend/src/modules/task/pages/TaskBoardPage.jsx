import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTask } from '../../../hooks/useTask';
import { useProject } from '../../../hooks/useProject';
import { useWorkspace } from '../../../hooks/useWorkspace';
import { useAuth } from '../../../hooks/useAuth';
import { useSocket } from '../../../hooks/useSocket';

import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import BoardColumn from '../components/BoardColumn';

const STATUS_COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done'];

export default function TaskBoardPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { currentProject, myWorkspaceRole, selectProject } = useProject();
  const { currentWorkspace, selectWorkspace } = useWorkspace();
  // 1. changeTaskStatus aur changeTaskOrder ko destructure kiya
  const { tasks, loading, error, fetchProjectTasks, createTask, applyRealtimeTaskEvent, changeTaskStatus, changeTaskOrder } = useTask();
  const { socket, connected, joinProject, leaveProject } = useSocket();

  const [createOpen, setCreateOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);

  useEffect(() => {
    selectProject(projectId);
    fetchProjectTasks(projectId);
  }, [projectId, selectProject, fetchProjectTasks]);

  // Load the parent workspace too — needed for the assignee picker (workspace member list)
  useEffect(() => {
    if (currentProject?.workspaceId) {
      selectWorkspace(currentProject.workspaceId);
    }
  }, [currentProject?.workspaceId, selectWorkspace]);

  // ============================================
  // Join this project's Socket.io room while the board is open
  // ============================================
  useEffect(() => {
    if (!connected) return;

    joinProject(projectId);

    const handleCreated = (task) => applyRealtimeTaskEvent('task:created', task);
    const handleUpdated = (task) => applyRealtimeTaskEvent('task:updated', task);
    const handleDeleted = (payload) => applyRealtimeTaskEvent('task:deleted', payload);

    socket.on('task:created', handleCreated);
    socket.on('task:updated', handleUpdated);
    socket.on('task:deleted', handleDeleted);

    return () => {
      leaveProject(projectId);
      socket.off('task:created', handleCreated);
      socket.off('task:updated', handleUpdated);
      socket.off('task:deleted', handleDeleted);
    };
  }, [connected, projectId, socket, joinProject, leaveProject, applyRealtimeTaskEvent]);

  const canCreate = myWorkspaceRole === 'Owner' || myWorkspaceRole === 'Admin' || myWorkspaceRole === 'Member';

  // 2. tasksByStatus ko update kiya order sort ke sath
  const tasksByStatus = (status) => tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

  // 3. sensors aur handleDragEnd add kiya
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  
  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    const overTask = tasks.find((t) => t._id === over.id);
    const destStatus = overTask
      ? overTask.status
      : typeof over.id === 'string' && over.id.startsWith('column-')
      ? over.id.replace('column-', '')
      : activeTask.status;

    if (destStatus !== activeTask.status) {
      await changeTaskStatus(activeTask._id, destStatus);
    }

    const destColumnTasks = tasksByStatus(destStatus).filter((t) => t._id !== activeTask._id);
    const dropIndex = overTask ? destColumnTasks.findIndex((t) => t._id === overTask._id) : destColumnTasks.length;
    const newOrder = dropIndex <= 0 ? 0 : (destColumnTasks[dropIndex - 1]?.order ?? 0) + 1;
    
    await changeTaskOrder(activeTask._id, newOrder);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <Link to={`/projects/${projectId}`} className="text-sm text-primary font-medium">
          &larr; Back to project
        </Link>

        <div className="flex items-center justify-between mt-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{currentProject?.name || 'Project'} — Tasks</h1>
              <span
                className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`}
                title={connected ? 'Live updates connected' : 'Live updates offline'}
              />
            </div>
            <p className="text-sm text-gray-500">Board view</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setCreateOpen(true)}
              className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              + New Task
            </button>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-400">Loading tasks...</p>
        ) : (
          // 4. Grid block ko DndContext aur BoardColumn se replace kiya
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {STATUS_COLUMNS.map((status) => (
                <BoardColumn key={status} status={status} tasks={tasksByStatus(status)} onTaskClick={setActiveTaskId} />
              ))}
            </div>
          </DndContext>
        )}
      </div>

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(payload) => createTask(projectId, payload)}
        workspaceMembers={currentWorkspace?.members || []}
      />

      <TaskDetailModal
        taskId={activeTaskId}
        open={!!activeTaskId}
        onClose={() => setActiveTaskId(null)}
        workspaceMembers={currentWorkspace?.members || []}
        myWorkspaceRole={myWorkspaceRole}
        currentUserId={user?.id}
      />
    </div>
  );
}
