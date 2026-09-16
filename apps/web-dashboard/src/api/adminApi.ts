// Single import surface for the Admin Console. Combines the two real
// backends it talks to:
//   - Express auth-service (via apiClient here)  -> identity, users, lifecycle
//   - FastAPI gateway (via apiService)            -> operational/simulation data
// No endpoint here is invented -- every call maps to a route verified in
// docs/ADMIN_CONSOLE_IMPLEMENTATION_SPEC.md §C.
import { apiClient as authClient } from './apiClient';
import { apiService } from '../services/apiService';
import { AdminUserRecord, ProvisionUserPayload, AccountStatus, SensorNode } from '../types/admin';
import { UserRole } from '../types/auth';

export const adminApi = {
  // --- Identity / account lifecycle (Express auth-service) ---
  listUsers: async (): Promise<AdminUserRecord[]> => {
    const res = await authClient.get<{ users: AdminUserRecord[] }>('/auth/users');
    return res.data.users;
  },

  provisionUser: async (payload: ProvisionUserPayload) => {
    const res = await authClient.post('/auth/register', payload);
    return res.data as { message: string; user: unknown };
  },

  updateUserStatus: async (userId: string, status: AccountStatus) => {
    const res = await authClient.patch<{ message: string; user: AdminUserRecord }>(
      `/auth/users/${userId}/status`,
      { status }
    );
    return res.data;
  },

  updateUserRole: async (userId: string, role: UserRole) => {
    const res = await authClient.patch<{ message: string; user: AdminUserRecord }>(
      `/auth/users/${userId}/role`,
      { role }
    );
    return res.data;
  },

  updateUserDistrict: async (userId: string, district: string) => {
    const res = await authClient.patch<{ message: string; user: AdminUserRecord }>(
      `/auth/users/${userId}/district`,
      { district }
    );
    return res.data;
  },

  // Derives the canonical 18-district list from live sensor topology rather
  // than hardcoding a third copy of it in the frontend.
  getDistricts: async (): Promise<string[]> => {
    const sensors: SensorNode[] = await apiService.getSensors();
    return Array.from(new Set(sensors.map((s) => s.district))).sort((a, b) => a.localeCompare(b));
  },

  // --- Operational oversight (FastAPI gateway) ---
  getDashboardSummary: apiService.getDashboardSummary,
  getSensors: apiService.getSensors,
  getRouteGraph: apiService.getRouteGraph,
  getSOS: apiService.getSOS,
  resolveSOS: apiService.resolveSOS,
  getReports: apiService.getReports,
  getVehicles: apiService.getVehicles,
  getWarehouses: apiService.getWarehouses,
  getSupplyGapIntelligence: apiService.getSupplyGapIntelligence,
  getOutbox: apiService.getOutbox,
  getSubscribers: apiService.getSubscribers,
  getFeatureImportance: apiService.getFeatureImportance,
  getModelInfo: apiService.getModelInfo,
  getAlerts: apiService.getAlerts,
  getHealth: apiService.getHealth,
  // Admin/Emergency-Operator-only demo-control actions (backend-enforced)
  injectStorm: apiService.injectStorm,
  resetScenario: apiService.resetScenario,
};
