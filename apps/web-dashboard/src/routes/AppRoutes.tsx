import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoutes } from './AdminRoutes';
import { LogisticsRoutes } from './LogisticsRoutes';
import { EmergencyRoutes } from './EmergencyRoutes';
import { LoginPage } from '../pages/LoginPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { ProfilePage } from '../pages/ProfilePage';
import { DashboardPage } from '../pages/DashboardPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { useAuth } from '../hooks/useAuth';

// Automatic Role-to-Dashboard Router
const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role;
  if (role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (role === 'EMERGENCY_OPERATOR') {
    return <Navigate to="/emergency" replace />;
  }
  if (role === 'LOGISTICS_OPERATOR') {
    return <Navigate to="/logistics" replace />;
  }
  if (role === 'FIELD_OFFICER') {
    return <Navigate to="/field" replace />;
  }
  if (role === 'DRIVER') {
    return <Navigate to="/driver" replace />;
  }
  return <Navigate to="/logistics" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Profile Route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Role-Based Dashboard Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logistics/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_OPERATOR']}>
            <LogisticsRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/emergency/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'EMERGENCY_OPERATOR', 'DISTRICT_AUTHORITY']}>
            <EmergencyRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/field"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'FIELD_OFFICER']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'DRIVER']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Default Role Redirect Route */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleBasedRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleBasedRedirect />
          </ProtectedRoute>
        }
      />

      {/* Wildcard Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
