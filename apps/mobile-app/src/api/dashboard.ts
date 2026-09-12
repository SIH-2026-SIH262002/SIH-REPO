import { apiClient } from './client';
import { DashboardSummary } from '../types';

export const DUMMY_DASHBOARD_SUMMARY: DashboardSummary = {
  nodes_by_category: {
    LOW: 12,
    MODERATE: 8,
    HIGH: 4,
    SEVERE: 2,
  },
  total_nodes: 26,
  flagged_corridors: 3,
  blocked_corridors: 1,
  active_alerts: 3,
  total_alerts_logged: 18,
  open_sos: 1,
  vehicles_total: 5,
  vehicles_by_status: {
    EN_ROUTE: 2,
    IDLE: 1,
    DELAYED: 1,
    EMERGENCY: 1,
  },
  district_status: [
    {
      district: 'East Jaintia Hills',
      state: 'Meghalaya',
      node_name: 'Sonapur Tunnel Node SS-04',
      risk_score: 88.5,
      category: 'SEVERE',
      storm_event: true,
      manually_flagged: true,
    },
    {
      district: 'East Khasi Hills',
      state: 'Meghalaya',
      node_name: 'Shillong Bypass Corridor SHL-01',
      risk_score: 74.2,
      category: 'HIGH',
      storm_event: true,
      manually_flagged: false,
    },
    {
      district: 'Kamrup Metro',
      state: 'Assam',
      node_name: 'Jalukbari Transport Hub GHY-02',
      risk_score: 61.8,
      category: 'HIGH',
      storm_event: false,
      manually_flagged: false,
    },
    {
      district: 'West Jaintia Hills',
      state: 'Meghalaya',
      node_name: 'Jowai Ridge Section JOW-01',
      risk_score: 48.0,
      category: 'MODERATE',
      storm_event: false,
      manually_flagged: false,
    },
    {
      district: 'Kohima',
      state: 'Nagaland',
      node_name: 'Kohima Bypass Route KOH-03',
      risk_score: 28.5,
      category: 'LOW',
      storm_event: false,
      manually_flagged: false,
    },
  ],
  recent_alerts: [
    {
      id: 'ALT-2026-001',
      type: 'LANDSLIDE_RISK',
      severity: 'SEVERE',
      location: 'NH-6 Sonapur Tunnel Section, East Jaintia Hills',
      timestamp: new Date().toISOString(),
      description: 'Heavy slope deformation detected by IoT sensor SS-04.',
      active: true,
      district: 'East Jaintia Hills',
    },
  ],
};

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    try {
      const response = await apiClient.get<DashboardSummary>('/api/dashboard/summary');
      if (response.data && response.data.total_nodes > 0) {
        return response.data;
      }
      return DUMMY_DASHBOARD_SUMMARY;
    } catch (_err) {
      return DUMMY_DASHBOARD_SUMMARY;
    }
  },
};

