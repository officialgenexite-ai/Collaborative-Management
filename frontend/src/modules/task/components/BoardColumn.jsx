import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTaskCard from './SortableTaskCard';

export default function BoardColumn({ status, tasks, onTaskClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });
  const taskIds = tasks.map((t) => t._id);

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl p-3 min-h-[120px] transition ${
        isOver ? 'bg-primary/5 ring-2 ring-primary/30' : 'bg-gray-100'
      }`}
    >
      <h3 className="text-sm font-semibold text-gray-600 mb-3 px-1">
        {status} <span className="text-gray-400">({tasks.length})</span>
      </h3>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <SortableTaskCard key={task._id} task={task} onClick={() => onTaskClick(task._id)} />
          ))}
          {tasks.length === 0 && <p className="text-xs text-gray-400 px-1">No tasks</p>}
        </div>
      </SortableContext>
    </div>
  );
}
