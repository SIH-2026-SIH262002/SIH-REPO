import { apiClient } from './client';
import { Alert } from '../types';

export const DUMMY_ALERTS: Alert[] = [
  {
    id: 'ALT-2026-001',
    type: 'LANDSLIDE_RISK',
    severity: 'SEVERE',
    location: 'NH-6 Sonapur Tunnel Section, East Jaintia Hills',
    timestamp: new Date().toISOString(),
    description: 'Heavy slope deformation detected by IoT sensor SS-04. High probability of debris blockage within next 3 hours. Vehicles advised to halt at Lad Rymbai.',
    active: true,
    district: 'East Jaintia Hills',
  },
  {
    id: 'ALT-2026-002',
    type: 'FLASH_FLOOD',
    severity: 'HIGH',
    location: 'Guwahati Low-Lying Bypass, Kamrup Metro',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    description: 'River Brahmaputra water level crossed warning threshold near Bharalumukh. Transport rerouted via VIP Road.',
    active: true,
    district: 'Kamrup Metro',
  },
  {
    id: 'ALT-2026-003',
    type: 'ROAD_BLOCKADE',
    severity: 'HIGH',
    location: 'Shillong-Jowai Highway (Km 42)',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    description: 'Tree fall and minor mudslide blocking one lane. Clearance teams deployed on site. Expected clearance in 90 mins.',
    active: true,
    district: 'West Jaintia Hills',
  },
  {
    id: 'ALT-2026-004',
    type: 'SENSOR_DISCONNECT',
    severity: 'MODERATE',
    location: 'Kohima Ridge Sensor Array, Nagaland',
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    description: 'Telemetry heartbeat lost for 2 nodes due to power disruption. Backup solar cell engaged.',
    active: false,
    district: 'Kohima',
  },
  {
    id: 'ALT-2026-005',
    type: 'WEATHER_ADVISORY',
    severity: 'LOW',
    location: 'Sub-Himalayan NER Region',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    description: 'IMD predicts continuous moderate rain over next 48 hours across Meghalaya & Assam border. Drivers maintain maximum caution.',
    active: false,
    district: 'Regional',
  },
];

export const alertsApi = {
  getAlerts: async (activeOnly: boolean = false): Promise<Alert[]> => {
    try {
      const response = await apiClient.get<Alert[]>('/api/alerts', {
        params: { active_only: activeOnly },
      });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return activeOnly ? response.data.filter((a) => a.active) : response.data;
      }
      return activeOnly ? DUMMY_ALERTS.filter((a) => a.active) : DUMMY_ALERTS;
    } catch (_err) {
      return activeOnly ? DUMMY_ALERTS.filter((a) => a.active) : DUMMY_ALERTS;
    }
  },
};

