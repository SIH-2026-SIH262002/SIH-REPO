import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LogisticsLayout } from '../components/logistics/layout/LogisticsLayout';
import { LogisticsOverviewPage } from '../pages/logistics/LogisticsOverviewPage';
import { LogisticsFleetPage } from '../pages/logistics/LogisticsFleetPage';
import { LogisticsJourneysPage } from '../pages/logistics/LogisticsJourneysPage';
import { LogisticsDeliveriesPage } from '../pages/logistics/LogisticsDeliveriesPage';
import { LogisticsRoutesPage } from '../pages/logistics/LogisticsRoutesPage';
import { LogisticsReroutingPage } from '../pages/logistics/LogisticsReroutingPage';
import { LogisticsRiskPage } from '../pages/logistics/LogisticsRiskPage';
import { LogisticsWarehousesPage } from '../pages/logistics/LogisticsWarehousesPage';
import { LogisticsNotificationsPage } from '../pages/logistics/LogisticsNotificationsPage';
import { ProfilePage } from '../pages/ProfilePage';

/**
 * The entire /logistics/* route tree for LOGISTICS_OPERATOR.
 * Mounted once, behind <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_OPERATOR']}> in AppRoutes.tsx.
 */
export const LogisticsRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<LogisticsLayout />}>
        <Route index element={<LogisticsOverviewPage />} />
        <Route path="fleet" element={<LogisticsFleetPage />} />
        <Route path="journeys" element={<LogisticsJourneysPage />} />
        <Route path="deliveries" element={<LogisticsDeliveriesPage />} />
        <Route path="routes" element={<LogisticsRoutesPage />} />
        <Route path="reroutes" element={<LogisticsReroutingPage />} />
        <Route path="risk" element={<LogisticsRiskPage />} />
        <Route path="warehouses" element={<LogisticsWarehousesPage />} />
        <Route path="notifications" element={<LogisticsNotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
};
