import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProject } from '../../../hooks/useProject';
import { useWorkspace } from '../../../hooks/useWorkspace';
import ProjectMembersModal from '../components/ProjectMembersModal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import * as aiApi from '../../ai/aiApi';

const STATUS_OPTIONS = ['Active', 'Completed', 'Archived'];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    currentProject,
    myWorkspaceRole,
    loading,
    error,
    selectProject,
    updateProject,
    archiveProject,
    addProjectMember,
    removeProjectMember
  } = useProject();
  const { currentWorkspace, selectWorkspace } = useWorkspace();

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [membersOpen, setMembersOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    selectProject(projectId);
  }, [projectId, selectProject]);

  // Load the parent workspace too — needed for the "add member" picker
  // (workspace member list) and it's a cheap call since it's cached-ish via context.
  useEffect(() => {
    if (currentProject?.workspaceId) {
      selectWorkspace(currentProject.workspaceId);
    }
  }, [currentProject?.workspaceId, selectWorkspace]);

  useEffect(() => {
    if (currentProject) {
      setNameDraft(currentProject.name);
      setDescDraft(currentProject.description || '');
    }
  }, [currentProject]);

  const canManage = myWorkspaceRole === 'Owner' || myWorkspaceRole === 'Admin';

  const handleSave = async () => {
    await updateProject(projectId, { name: nameDraft, description: descDraft });
    setEditing(false);
  };

  const handleStatusChange = async (status) => {
    await updateProject(projectId, { status });
  };

  const handleArchiveConfirmed = async () => {
    const workspaceId = currentProject.workspaceId;
    await archiveProject(projectId);
    navigate(`/workspaces/${workspaceId}/projects`);
  };

  if (loading && !currentProject) return <p className="text-gray-400 p-8">Loading project...</p>;
  if (error) return <p className="text-red-500 p-8">{error}</p>;
  if (!currentProject) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to={`/workspaces/${currentProject.workspaceId}/projects`} className="text-sm text-primary font-medium">
          &larr; Back to projects
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
                  onClick={handleSave}
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
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: currentProject.color }} />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{currentProject.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">{currentProject.description || 'No description'}</p>
                </div>
              </div>
              {canManage && (
                <button onClick={() => setEditing(true)} className="text-sm text-primary font-medium">
                  Edit
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-gray-500">Status:</span>
            {canManage ? (
              <select
                value={currentProject.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-medium text-gray-700">{currentProject.status}</span>
            )}
          </div>

          <button
            onClick={() => navigate(`/projects/${projectId}/tasks`)}
            className="w-full mb-6 text-sm bg-gray-900 hover:bg-gray-800 text-white font-semibold px-4 py-2.5 rounded-lg"
          >
            View Tasks →
          </button>
          {canManage && (
            <div className="space-y-3 mb-6">
              <button
                onClick={() => navigate(`/projects/${projectId}/automations`)}
                className="w-full text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2.5 rounded-lg"
              >
                ⚙️ Automations
              </button>

              {/* Added Reindex Button */}
              {canManage && (
                <button
                  onClick={async () => {
                    const res = await aiApi.reindexProject(projectId);
                    alert(`Indexed ${res.data.indexed} items`);
                  }}
                  className="w-full mb-6 text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 rounded-lg"
                >
                  🔍 Reindex Knowledge Base
                </button>
              )}

              <button
                onClick={() => navigate(`/projects/${projectId}/agent`)}
                className="w-full text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg"
              >
                🤖 Ask Agent
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Access</h2>
            {canManage && (
              <button
                onClick={() => setMembersOpen(true)}
                className="text-sm bg-primary hover:bg-primary-dark text-white font-semibold px-3 py-1.5 rounded-lg"
              >
                Manage Access
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {currentProject.members?.length === 0
              ? 'Open to all workspace Members.'
              : `${currentProject.members.length} people explicitly added (plus Owner/Admin).`}
          </p>

          <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Tasks for this project will live here next.</p>
            {canManage && (
              <button
                onClick={() => setConfirmArchive(true)}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Archive Project
              </button>
            )}
          </div>
        </div>
      </div>

      <ProjectMembersModal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        project={currentProject}
        workspaceMembers={currentWorkspace?.members || []}
        onAdd={(userId) => addProjectMember(projectId, userId)}
        onRemove={(userId) => removeProjectMember(projectId, userId)}
      />

      <ConfirmDialog
        open={confirmArchive}
        title="Archive project?"
        message="This project will be hidden from the workspace's project list."
        confirmLabel="Archive"
        danger
        onConfirm={handleArchiveConfirmed}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  );
}
