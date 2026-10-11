import { useEffect } from 'react';
import { useComment } from '../../../hooks/useComment';
import { useSocket } from '../../../hooks/useSocket';
import CommentItem from './CommentItem';
import CommentComposer from './CommentComposer';
import { useActivity } from '../../../hooks/useActivity';
import ActivityItem from '../../activity/components/ActivityItem';

export default function CommentThread({ taskId, currentUserId, myWorkspaceRole }) {
  const { comments, loading, fetchTaskComments, addComment, applyRealtimeCommentEvent } = useComment();
  const { socket, connected } = useSocket();
  const { activity, fetchTaskActivity } = useActivity();

  useEffect(() => {
    fetchTaskComments(taskId);
    fetchTaskActivity(taskId); // ADD THIS LINE
  }, [taskId, fetchTaskComments, fetchTaskActivity]);

  // Live sync — the task's project room already exists (TaskBoardPage joins
  // it), so comment events for THIS task just need filtering by taskId here.
  useEffect(() => {
    if (!connected) return;

    const matchesTask = (c) => (c.taskId?._id || c.taskId) === taskId;

    const handleNew = (c) => matchesTask(c) && applyRealtimeCommentEvent('comment:new', c);
    const handleUpdated = (c) => matchesTask(c) && applyRealtimeCommentEvent('comment:updated', c);
    const handleDeleted = (payload) => applyRealtimeCommentEvent('comment:deleted', payload);
    const handleReaction = (payload) => applyRealtimeCommentEvent('comment:reaction', payload);

    socket.on('comment:new', handleNew);
    socket.on('comment:updated', handleUpdated);
    socket.on('comment:deleted', handleDeleted);
    socket.on('comment:reaction', handleReaction);

    return () => {
      socket.off('comment:new', handleNew);
      socket.off('comment:updated', handleUpdated);
      socket.off('comment:deleted', handleDeleted);
      socket.off('comment:reaction', handleReaction);
    };
  }, [connected, socket, taskId, applyRealtimeCommentEvent]);

  const topLevel = comments.filter((c) => !c.parentCommentId);
  const repliesOf = (id) => comments.filter((c) => (c.parentCommentId?._id || c.parentCommentId) === id);

  // Merge top-level comments + activity entries into one chronological feed —
  // activity shows as small system messages between actual comments.
  const timeline = [
    ...topLevel.map((c) => ({ kind: 'comment', data: c, createdAt: c.createdAt })),
    ...activity.map((a) => ({ kind: 'activity', data: a, createdAt: a.createdAt }))
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="mt-6 pt-4 border-t border-gray-100">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Comments ({comments.length})</h4>

      {loading && comments.length === 0 && <p className="text-xs text-gray-400 mb-3">Loading comments...</p>}

      <div className="space-y-3 max-h-64 overflow-y-auto mb-3 pr-1">
        {timeline.length === 0 && !loading && (
          <p className="text-xs text-gray-400">No comments yet — start the discussion.</p>
        )}
        {timeline.map((item) =>
          item.kind === 'activity' ? (
            <ActivityItem key={item.data._id} entry={item.data} />
          ) : (
            <CommentItem
              key={item.data._id}
              comment={item.data}
              replies={repliesOf(item.data._id)}
              currentUserId={currentUserId}
              myWorkspaceRole={myWorkspaceRole}
            />
          )
        )}
      </div>

      <CommentComposer
        onSubmit={(text) => addComment(taskId, { text, mentions: [] })}
        placeholder="Add a comment..."
      />
    </div>
  );
}
