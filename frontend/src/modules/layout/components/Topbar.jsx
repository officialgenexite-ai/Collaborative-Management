import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import WorkspaceSwitcher from './Workspaceswitcher';
import NotificationBell from '../../notification/components/NotificationBell';

export default function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-4 shrink-0">
      <WorkspaceSwitcher />
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div
          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600"
          title={user?.name}
        >
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500">
          Logout
        </button>
      </div>
    </div>
  );
}
