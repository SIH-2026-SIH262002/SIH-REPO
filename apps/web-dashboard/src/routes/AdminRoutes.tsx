import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from '../components/admin/layout/AdminLayout';
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage';
import { UserDirectoryPage } from '../pages/admin/UserDirectoryPage';
import { ProvisionUserPage } from '../pages/admin/ProvisionUserPage';
import { UserRecordPage } from '../pages/admin/UserRecordPage';
import { DistrictRegistryPage } from '../pages/admin/DistrictRegistryPage';
import { RiskIntelligencePage } from '../pages/admin/RiskIntelligencePage';
import { EmergencyOversightPage } from '../pages/admin/EmergencyOversightPage';
import { FieldReportsPage } from '../pages/admin/FieldReportsPage';
import { FleetOversightPage } from '../pages/admin/FleetOversightPage';
import { SupplyOversightPage } from '../pages/admin/SupplyOversightPage';
import { NotificationsPage } from '../pages/admin/NotificationsPage';
import { ModelTransparencyPage } from '../pages/admin/ModelTransparencyPage';
import { ServiceStatusPage } from '../pages/admin/ServiceStatusPage';
import { AccountPage } from '../pages/admin/AccountPage';

/**
 * The entire /admin/* route tree, per
 * docs/ADMIN_CONSOLE_IMPLEMENTATION_SPEC.md §G. Mounted once, behind
 * <ProtectedRoute allowedRoles={['ADMIN']}> in AppRoutes.tsx.
 */
export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="users" element={<UserDirectoryPage />} />
        <Route path="users/provision" element={<ProvisionUserPage />} />
        <Route path="users/:userId" element={<UserRecordPage />} />
        <Route path="districts" element={<DistrictRegistryPage />} />
        <Route path="risk" element={<RiskIntelligencePage />} />
        <Route path="emergencies" element={<EmergencyOversightPage />} />
        <Route path="field-reports" element={<FieldReportsPage />} />
        <Route path="fleet" element={<FleetOversightPage />} />
        <Route path="supply" element={<SupplyOversightPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="model" element={<ModelTransparencyPage />} />
        <Route path="status" element={<ServiceStatusPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
    </Routes>
  );
};
