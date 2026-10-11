import { Outlet } from 'react-router-dom';
import IconRail from './IconRail';
import ProjectTreePanel from './Projecttreepanel';
import TopBar from './Topbar';
import { useNav } from '../../../hooks/useNav';

export default function AppLayout() {
  const { treeOpen } = useNav();

  return (
    <div className="flex h-screen overflow-hidden">
      <IconRail />
      {treeOpen && <ProjectTreePanel />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
