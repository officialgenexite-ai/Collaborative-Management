import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAutomation } from '../../../hooks/useAutomation';
import { useProject } from '../../../hooks/useProject';
import { useWorkspace } from '../../../hooks/useWorkspace';
import RuleBuilder from '../components/RuleBuilder';
import RuleList from '../components/RuleList';

export default function AutomationsPage() {
  const { projectId } = useParams();
  const { currentProject, myWorkspaceRole, selectProject } = useProject();
  const { currentWorkspace, selectWorkspace } = useWorkspace();
  const { rules, loading, error, fetchRules, createRule, toggleRule, removeRule } = useAutomation();
  const [builderOpen, setBuilderOpen] = useState(false);

  useEffect(() => {
    selectProject(projectId);
    fetchRules(projectId);
  }, [projectId, selectProject, fetchRules]);

  useEffect(() => {
    if (currentProject?.workspaceId) {
      selectWorkspace(currentProject.workspaceId);
    }
  }, [currentProject?.workspaceId, selectWorkspace]);

  const canManage = myWorkspaceRole === 'Owner' || myWorkspaceRole === 'Admin';

  if (!canManage && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Only workspace Owners/Admins can manage automations.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <Link to={`/projects/${projectId}`} className="text-sm text-primary font-medium">
          &larr; Back to project
        </Link>

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{currentProject?.name || 'Project'} — Automations</h1>
            <p className="text-sm text-gray-500">Automate repetitive task workflows</p>
          </div>
          <button
            onClick={() => setBuilderOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            + New Rule
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <RuleList
            rules={rules}
            onToggle={(ruleId) => toggleRule(projectId, ruleId)}
            onDelete={(ruleId) => removeRule(projectId, ruleId)}
          />
        )}
      </div>

      <RuleBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onCreate={(payload) => createRule(projectId, payload)}
        workspaceMembers={currentWorkspace?.members || []}
      />
    </div>
  );
}
