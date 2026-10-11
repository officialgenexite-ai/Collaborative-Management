import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ProjectProvider } from './context/ProjectContext';
import { TaskProvider } from './context/TaskContext';
import { CommentProvider } from './context/CommentContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './modules/components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import RegisterPage from './modules/auth/pages/RegisterPage';
import VerifyOtpPage from './modules/auth/pages/VerifyOtpPage';
import LoginPage from './modules/auth/pages/LoginPage';
import GoogleCallbackPage from './modules/auth/pages/GoogleCallbackPage';
import WorkspaceListPage from './modules/workspace/pages/WorkspaceListPage';
import WorkspaceDetailPage from './modules/workspace/pages/WorkspaceDetailPage';
import ProjectListPage from './modules/project/pages/ProjectListPage';
import ProjectDetailPage from './modules/project/pages/ProjectDetailPage';
import TaskBoardPage from './modules/task/pages/TaskBoardPage';
import { NotificationProvider } from './context/NotificationContext';
import NotificationBell from './modules/notification/components/NotificationBell';
import { ActivityProvider } from './context/ActivityContext';
import { AttachmentProvider } from './context/AttachmentContext';
// Rendered once, outside the route tree, so the bell persists across
import { TimeTrackingProvider } from './context/TimeTrackingContext';
import ActiveTimerWidget from './modules/timetracking/components/ActiveTimerWidget';
import TimesheetPage from './modules/timetracking/pages/TimesheetPage';
import { AutomationProvider } from './context/AutomationContext';
import AutomationsPage from './modules/automation/pages/AutomationsPage';
import { AIProvider } from './context/AIContext';
import AgentChatPage from './modules/ai/pages/AgentChatPage';
import { NavProvider } from './context/Navcontext';
import AppLayout from './modules/layout/components/Applayout';
import HomePage from './modules/layout/pages/Homepage';
// every page without touching each page's own JSX.
function GlobalBell() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <NotificationBell />;
}

// नया GlobalTimerWidget यहाँ ऐड किया गया है
function GlobalTimerWidget() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <ActiveTimerWidget />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      <Route element={<ProtectedRoute><NavProvider><AppLayout /></NavProvider></ProtectedRoute>}>
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="workspaces" element={<WorkspaceListPage />} />
        <Route path="workspaces/:workspaceId" element={<WorkspaceDetailPage />} />
        <Route path="workspaces/:workspaceId/projects" element={<ProjectListPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="projects/:projectId/tasks" element={<TaskBoardPage />} />
        <Route path="projects/:projectId/automations" element={<AutomationsPage />} />
        <Route path="projects/:projectId/agent" element={<AgentChatPage />} />
        <Route path="timesheet" element={<TimesheetPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <WorkspaceProvider>
              <ProjectProvider>
                <TaskProvider>
                  <CommentProvider>
                    <ActivityProvider>
                      <AttachmentProvider>
                        <TimeTrackingProvider>
  <AutomationProvider>
  <AIProvider>
    <GlobalBell />
    <GlobalTimerWidget />
    <AppRoutes />
  </AIProvider>
</AutomationProvider>
</TimeTrackingProvider>
                      </AttachmentProvider>
                    </ActivityProvider>
                  </CommentProvider>
                </TaskProvider>
              </ProjectProvider>
            </WorkspaceProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
