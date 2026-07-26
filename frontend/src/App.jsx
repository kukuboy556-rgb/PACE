import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './hooks/useTheme';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import PDODashboard from './pages/PDODashboard';
import TeamList from './pages/TeamList';
import TeamBoard from './pages/TeamBoard';
import ProjectBoard from './pages/ProjectBoard';
import DocumentVault from './pages/DocumentVault';
import CoordinationLog from './pages/CoordinationLog';
import VerificationLog from './pages/VerificationLog';
import CalendarPage from './pages/CalendarPage';
import CompliancePage from './pages/CompliancePage';
import SIPPage from './pages/SIPPage';
import StakeholderPage from './pages/StakeholderPage';
import CorrespondencePage from './pages/CorrespondencePage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

function ProtectedRoute({ children, pdoOnly = false, schoolHeadAllowed = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (pdoOnly && !user.isPDO) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ErrorBoundary><PDODashboard /></ErrorBoundary>} />
        <Route path="teams" element={<ErrorBoundary><TeamList /></ErrorBoundary>} />
        <Route path="teams/:teamId" element={<ErrorBoundary><TeamBoard /></ErrorBoundary>} />
        <Route path="teams/:teamId/projects/:projectId" element={<ErrorBoundary><ProjectBoard /></ErrorBoundary>} />
        <Route path="teams/:teamId/documents" element={<ErrorBoundary><DocumentVault /></ErrorBoundary>} />
        <Route path="teams/:teamId/logs" element={<ErrorBoundary><CoordinationLog /></ErrorBoundary>} />
        <Route path="compliance" element={<ErrorBoundary><CompliancePage /></ErrorBoundary>} />
        <Route path="sip" element={<ErrorBoundary><SIPPage /></ErrorBoundary>} />
        <Route path="stakeholders" element={<ErrorBoundary><StakeholderPage /></ErrorBoundary>} />
        <Route path="correspondence" element={<ErrorBoundary><CorrespondencePage /></ErrorBoundary>} />
        <Route path="calendar" element={<ErrorBoundary><CalendarPage /></ErrorBoundary>} />
        <Route path="verification" element={<ErrorBoundary><VerificationLog /></ErrorBoundary>} />
        <Route path="profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
