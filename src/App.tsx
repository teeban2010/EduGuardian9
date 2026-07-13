import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SchoolProvider, useSchool } from './contexts/SchoolContext';
import { ColorModeProvider } from './contexts/ColorModeContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import Layout from './components/layout/Layout';

// Landing page
import Landing from './pages/Landing';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import SchoolLogin from './pages/auth/SchoolLogin';

// Parent pages
import ParentDashboard from './pages/parent/Dashboard';
import Homework from './pages/parent/Homework';
import Attendance from './pages/parent/Attendance';
import Progress from './pages/parent/Progress';
import Calendar from './pages/parent/Calendar';
import ResourceLibrary from './pages/parent/ResourceLibrary';
import ChildProfile from './pages/parent/ChildProfile';
import DisciplineRecord from './pages/parent/DisciplineRecord';
import SchoolInfo from './pages/parent/SchoolInfo';
import CanteenMenu from './pages/parent/CanteenMenu';

// Shared pages
import AIAssistant from './pages/ai/AIAssistant';
import Notifications from './pages/notifications/Notifications';
import Settings from './pages/settings/Settings';
import Search from './pages/search/Search';

// Role dashboards
import TeacherDashboard from './pages/teacher/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import StudentsManagement from './pages/admin/StudentsManagement';
import GuestDashboard from './pages/guest/GuestDashboard';

function RoleDashboard() {
  const { profile, user } = useAuth();
  const { isGuest } = useSchool();
  if (isGuest && !user) return <GuestDashboard />;
  if (profile?.is_super_admin) return <SuperAdminDashboard />;
  if (profile?.role === 'admin') return <AdminDashboard />;
  if (profile?.role === 'teacher') return <TeacherDashboard />;
  return <ParentDashboard />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { school, loading: schoolLoading, isGuest } = useSchool();

  if (authLoading || schoolLoading) {
    return <LoadingSpinner fullScreen message="Loading EduGuardian AI..." />;
  }

  if (!user && !isGuest) {
    return <Navigate to="/" replace />;
  }

  if (!school) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}


function StaffRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const allowed = profile?.is_super_admin || profile?.role === 'admin' || profile?.role === 'teacher';
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isGuest } = useSchool();
  if (loading) return <LoadingSpinner fullScreen message="Loading..." />;
  if (user && !isGuest) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function SchoolRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { school, loading: schoolLoading, isGuest } = useSchool();

  if (authLoading || schoolLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  // Authenticated (non-guest) users with a school go straight to dashboard
  if (user && school && !isGuest) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Landing />} />

      {/* School-specific routes */}
      <Route path="/school-login" element={<SchoolRoute><SchoolLogin /></SchoolRoute>} />

      {/* Legacy auth routes (redirected to landing) */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />
      <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="/homework" element={<ProtectedRoute><Homework /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/discipline" element={<ProtectedRoute><DisciplineRecord /></ProtectedRoute>} />
      <Route path="/resources" element={<ProtectedRoute><ResourceLibrary /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ChildProfile /></ProtectedRoute>} />
      <Route path="/school-info" element={<ProtectedRoute><SchoolInfo /></ProtectedRoute>} />
      <Route path="/canteen" element={<ProtectedRoute><CanteenMenu /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><StaffRoute><StudentsManagement /></StaffRoute></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ColorModeProvider>
      <AuthProvider>
        <SchoolProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SchoolProvider>
      </AuthProvider>
    </ColorModeProvider>
  );
}
