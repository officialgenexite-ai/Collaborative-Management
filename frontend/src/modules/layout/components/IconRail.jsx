import { useLocation, useNavigate } from 'react-router-dom';
import { useNav } from '../../../hooks/useNav';

const ICONS = [
  { key: 'home', label: 'Home', icon: '🏠', path: '/home' },
  { key: 'projects', label: 'Projects', icon: '📁' },
  { key: 'tasks', label: 'Tasks', icon: '✅' },
  { key: 'ai', label: 'AI Agent', icon: '🤖' }, // goes to the first project's agent
  { key: 'timesheet', label: 'Timesheet', icon: '⏱', path: '/timesheet' },
  { key: 'teams', label: 'Team & Roles', icon: '👥' } // goes to active workspace detail
];

export default function IconRail() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { activeWorkspace, setTreeOpen, projects } = useNav();

  const isActive = (key) => {
    switch (key) {
      case 'home':
        return pathname === '/' || pathname === '/home';
      case 'projects':
        return pathname === '/workspaces'
          || /^\/workspaces\/[^/]+\/projects(?:\/|$)/.test(pathname)
          || /^\/projects\/[^/]+\/?$/.test(pathname)
          || /^\/projects\/[^/]+\/automations(?:\/|$)/.test(pathname);
      case 'tasks':
        return /^\/projects\/[^/]+\/tasks(?:\/|$)/.test(pathname);
      case 'ai':
        return /^\/projects\/[^/]+\/agent(?:\/|$)/.test(pathname);
      case 'timesheet':
        return pathname === '/timesheet';
      case 'teams':
        return /^\/workspaces\/[^/]+\/?$/.test(pathname);
      default:
        return false;
    }
  };

  const handleClick = (item) => {
    if (item.key === 'projects') {
      setTreeOpen(false);
      navigate(activeWorkspace ? `/workspaces/${activeWorkspace._id}/projects` : '/workspaces');
      return;
    }
    if (item.key === 'tasks') {
      const firstProject = projects[0];
      if (firstProject) navigate(`/projects/${firstProject._id}/tasks`);
      else navigate(activeWorkspace ? `/workspaces/${activeWorkspace._id}/projects` : '/workspaces');
      return;
    }
    if (item.key === 'teams') {
      if (activeWorkspace) navigate(`/workspaces/${activeWorkspace._id}`);
      return;
    }
    if (item.key === 'ai') {
      if (projects[0]) navigate(`/projects/${projects[0]._id}/agent`);
      return;
    }
    navigate(item.path);
  };

  return (
    <div className="w-14 bg-gray-900 flex flex-col items-center py-4 gap-1 shrink-0">
      <div
        className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center text-sm font-bold mb-4"
        title={activeWorkspace?.name || 'Workspace'}
      >
        {activeWorkspace?.name?.charAt(0)?.toUpperCase() || 'W'}
      </div>
      {ICONS.map((item) => (
        <button
          key={item.key}
          onClick={() => handleClick(item)}
          title={item.label}
          aria-current={isActive(item.key) ? 'page' : undefined}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
            isActive(item.key) ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}
