import { useState } from 'react';
import { useComment } from '../../../hooks/useComment';
import ReactionBar from './ReactionBar';
import CommentComposer from './CommentComposer';

export default function CommentItem({ comment, replies, currentUserId, myWorkspaceRole }) {
  const { editComment, removeComment, addReply, toggleReaction } = useComment();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);

  const isOwnerOrAdmin = myWorkspaceRole === 'Owner' || myWorkspaceRole === 'Admin';
  const isAuthor = (comment.userId?._id || comment.userId) === currentUserId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isOwnerOrAdmin;

  const handleSaveEdit = async () => {
    if (!draft.trim()) return;
    await editComment(comment._id, draft.trim());
    setEditing(false);
  };

  const handleReply = async (text) => {
    await addReply(comment._id, { text, mentions: [] });
    setReplying(false);
  };

  return (
    <div className="text-sm">
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
          {comment.userId?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-gray-900">{comment.userId?.name || 'Unknown'}</span>
            <span className="text-[11px] text-gray-400">
              {new Date(comment.createdAt).toLocaleString()} {comment.isEdited && '(edited)'}
            </span>
          </div>

          {editing ? (
            <div className="mt-1">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2 mt-1">
                <button onClick={handleSaveEdit} className="text-xs text-primary font-medium">Save</button>
                <button onClick={() => setEditing(false)} className="text-xs text-gray-500">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 mt-0.5 break-words">{comment.text}</p>
          )}

          <div className="flex items-center gap-3 mt-1">
            <ReactionBar
              reactions={comment.reactions}
              currentUserId={currentUserId}
              onToggle={(emoji) => toggleReaction(comment._id, emoji)}
            />
            <button onClick={() => setReplying((r) => !r)} className="text-xs text-gray-500 hover:text-primary">
              Reply
            </button>
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-gray-500 hover:text-primary">
                Edit
              </button>
            )}
            {canDelete && (
              <button onClick={() => removeComment(comment._id)} className="text-xs text-gray-500 hover:text-red-500">
                Delete
              </button>
            )}
          </div>

          {replying && (
            <div className="mt-2">
              <CommentComposer onSubmit={handleReply} placeholder="Write a reply..." autoFocus small />
            </div>
          )}

          {replies?.length > 0 && (
            <div className="mt-2 pl-4 border-l-2 border-gray-100 space-y-2">
              {replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  replies={[]}
                  currentUserId={currentUserId}
                  myWorkspaceRole={myWorkspaceRole}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
