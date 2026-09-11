/**
 * EmergencyRoutes.tsx — Dedicated route tree for /emergency/*
 *
 * All routes are protected under the EmergencyLayout shell.
 * Role enforcement is done at the AppRoutes level (ProtectedRoute).
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EmergencyLayout } from '../components/emergency/layout/EmergencyLayout';
import { EmergencyOverviewPage } from '../pages/emergency/EmergencyOverviewPage';
import { EmergencySosQueuePage } from '../pages/emergency/EmergencySosQueuePage';
import { EmergencySosDetailPage } from '../pages/emergency/EmergencySosDetailPage';
import { EmergencyResourcesPage } from '../pages/emergency/EmergencyResourcesPage';
import { EmergencyNotificationsPage } from '../pages/emergency/EmergencyNotificationsPage';
import { EmergencyProfilePage } from '../pages/emergency/EmergencyProfilePage';

export const EmergencyRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<EmergencyLayout />}>
        {/* Index → Overview */}
        <Route index element={<EmergencyOverviewPage />} />

        {/* SOS Queue */}
        <Route path="sos" element={<EmergencySosQueuePage />} />

        {/* SOS Detail */}
        <Route path="sos/:id" element={<EmergencySosDetailPage />} />

        {/* Emergency Resources */}
        <Route path="resources" element={<EmergencyResourcesPage />} />

        {/* Notifications */}
        <Route path="notifications" element={<EmergencyNotificationsPage />} />

        {/* Profile */}
        <Route path="profile" element={<EmergencyProfilePage />} />

        {/* Catch unknown sub-paths → back to overview */}
        <Route path="*" element={<Navigate to="/emergency" replace />} />
      </Route>
    </Routes>
  );
};
