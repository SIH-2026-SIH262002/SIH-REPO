import { apiClient } from './client';
import { SOSEvent, SOSPayload } from '../types';

export const DUMMY_SOS_EVENTS: SOSEvent[] = [
  {
    id: 'SOS-901',
    vehicle_id: 'AS-01-HC-4092',
    driver_name: 'Demo Driver (Ramesh Kumar)',
    phone: '+91 98765 43210',
    lat: 25.5788,
    lon: 91.8933,
    issue_type: 'landslide_trapped',
    message: 'Debris fall blocked front bumper near Sonapur Tunnel south portal. Requesting emergency road clearing unit.',
    timestamp: new Date().toISOString(),
    status: 'OPEN',
  },
  {
    id: 'SOS-902',
    vehicle_id: 'ML-05-EV-1102',
    driver_name: 'Tenzing Norgay',
    phone: '+91 98123 45678',
    lat: 25.4411,
    lon: 92.2033,
    issue_type: 'vehicle_breakdown',
    message: 'Engine overheat on steep incline near Jowai bypass.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'RESOLVED',
  },
];

export const sosApi = {
  triggerSOS: async (payload: SOSPayload): Promise<{ event: SOSEvent; notifications?: any[] }> => {
    try {
      const response = await apiClient.post('/api/sos', {
        vehicle_id: payload.vehicle_id || null,
        driver_name: payload.driver_name,
        phone: payload.phone,
        lat: payload.lat,
        lon: payload.lon,
        issue_type: payload.issue_type || 'vehicle_breakdown',
        message: payload.message || '',
      });
      return response.data;
    } catch (_err) {
      const created: SOSEvent = {
        id: `SOS-${Date.now().toString().slice(-4)}`,
        vehicle_id: payload.vehicle_id || 'DEMO-VEHICLE-01',
        driver_name: payload.driver_name || 'Demo Driver',
        phone: payload.phone || '+91 98765 43210',
        lat: payload.lat,
        lon: payload.lon,
        issue_type: payload.issue_type || 'vehicle_breakdown',
        message: payload.message || 'Emergency SOS signal emitted',
        timestamp: new Date().toISOString(),
        status: 'OPEN',
      };
      DUMMY_SOS_EVENTS.unshift(created);
      return { event: created };
    }
  },

  listSOS: async (): Promise<SOSEvent[]> => {
    try {
      const response = await apiClient.get<SOSEvent[]>('/api/sos');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return DUMMY_SOS_EVENTS;
    } catch (_err) {
      return DUMMY_SOS_EVENTS;
    }
  },

  resolveSOS: async (sosId: string): Promise<SOSEvent> => {
    try {
      const response = await apiClient.post<SOSEvent>(`/api/sos/${sosId}/resolve`);
      return response.data;
    } catch (_err) {
      const match = DUMMY_SOS_EVENTS.find((s) => s.id === sosId);
      if (match) {
        match.status = 'RESOLVED';
        return match;
      }
      return DUMMY_SOS_EVENTS[0];
    }
  }
};

