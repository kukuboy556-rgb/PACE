import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/Toast';
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
        <Route index element={<ProtectedRoute><PDODashboard /></ProtectedRoute>} />
        <Route path="teams" element={<ProtectedRoute pdoOnly><TeamList /></ProtectedRoute>} />
        <Route path="teams/:teamId" element={<ProtectedRoute><TeamBoard /></ProtectedRoute>} />
        <Route path="teams/:teamId/projects/:projectId" element={<ProtectedRoute><ProjectBoard /></ProtectedRoute>} />
        <Route path="teams/:teamId/documents" element={<ProtectedRoute><DocumentVault /></ProtectedRoute>} />
        <Route path="teams/:teamId/logs" element={<ProtectedRoute><CoordinationLog /></ProtectedRoute>} />
        <Route path="compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
        <Route path="sip" element={<ProtectedRoute><SIPPage /></ProtectedRoute>} />
        <Route path="stakeholders" element={<ProtectedRoute><StakeholderPage /></ProtectedRoute>} />
        <Route path="correspondence" element={<ProtectedRoute><CorrespondencePage /></ProtectedRoute>} />
        <Route path="calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="verification" element={<ProtectedRoute><VerificationLog /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
