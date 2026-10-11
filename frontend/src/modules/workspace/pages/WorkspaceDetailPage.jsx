import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../../../hooks/useWorkspace';
import MemberRow from '../components/MemberRow';
import InviteMemberModal from '../components/InviteMemberModal';
import ConfirmDialog from '../../../components/ConfirmDialog';

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const {
    currentWorkspace,
    myRole,
    loading,
    error,
    selectWorkspace,
    updateWorkspace,
    inviteMember,
    changeMemberRole,
    removeMember,
    archiveWorkspace
  } = useWorkspace();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null); // holds targetUserId
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    selectWorkspace(workspaceId);
  }, [workspaceId, selectWorkspace]);

  useEffect(() => {
    if (currentWorkspace) {
      setNameDraft(currentWorkspace.name);
      setDescDraft(currentWorkspace.description || '');
    }
  }, [currentWorkspace]);

  // Permission gates — mirror the backend's requireRole checks exactly
  const canManage = myRole === 'Owner' || myRole === 'Admin'; // invite, edit, remove
  const isOwner = myRole === 'Owner'; // role-change, archive

  const handleSaveDetails = async () => {
    await updateWorkspace(workspaceId, { name: nameDraft, description: descDraft });
    setEditing(false);
  };

  const handleRemoveConfirmed = async () => {
    await removeMember(workspaceId, confirmRemove);
    setConfirmRemove(null);
  };

  const handleArchiveConfirmed = async () => {
    await archiveWorkspace(workspaceId);
    navigate('/workspaces');
  };

  if (loading && !currentWorkspace) {
    return <p className="text-gray-400 p-8">Loading workspace...</p>;
  }

  if (error) {
    return <p className="text-red-500 p-8">{error}</p>;
  }

  if (!currentWorkspace) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/workspaces" className="text-sm text-primary font-medium">
          &larr; Back to workspaces
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
          {editing ? (
            <div className="mb-4">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="w-full text-xl font-bold border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={2}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSaveDetails}
                  className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="text-sm text-gray-500 px-4 py-2">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentWorkspace.name}</h1>
                <p className="text-sm text-gray-500 mt-1">{currentWorkspace.description || 'No description'}</p>
              </div>
              {canManage && (
                <button onClick={() => setEditing(true)} className="text-sm text-primary font-medium">
                  Edit
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/projects`)}
            className="w-full mb-6 text-sm bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-lg"
          >
            View Projects →
          </button>

          <div className="flex items-center justify-between mt-6 mb-3">
            <h2 className="font-semibold text-gray-900">Members ({currentWorkspace.members.length})</h2>
            {canManage && (
              <button
                onClick={() => setInviteOpen(true)}
                className="text-sm bg-primary hover:bg-primary-dark text-white font-semibold px-3 py-1.5 rounded-lg"
              >
                + Invite
              </button>
            )}
          </div>

          <div>
            {currentWorkspace.members.map((member) => (
              <MemberRow
                key={member.userId._id || member.userId}
                member={member}
                canManage={canManage}
                isOwnerViewer={isOwner}
                onChangeRole={(targetUserId, newRole) => changeMemberRole(workspaceId, targetUserId, newRole)}
                onRemove={(targetUserId) => setConfirmRemove(targetUserId)}
              />
            ))}
          </div>

          {isOwner && (
            <div className="mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => setConfirmArchive(true)}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Archive Workspace
              </button>
            </div>
          )}
        </div>
      </div>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(payload) => inviteMember(workspaceId, payload)}
      />

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remove member?"
        message="This member will lose access to this workspace immediately."
        confirmLabel="Remove"
        danger
        onConfirm={handleRemoveConfirmed}
        onCancel={() => setConfirmRemove(null)}
      />

      <ConfirmDialog
        open={confirmArchive}
        title="Archive workspace?"
        message="This workspace will be archived and hidden from your workspace list."
        confirmLabel="Archive"
        danger
        onConfirm={handleArchiveConfirmed}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  );
}
