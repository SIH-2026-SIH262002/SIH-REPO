import { apiClient } from './client';
import { IncidentReport } from '../types';

export const DUMMY_INCIDENTS: IncidentReport[] = [
  {
    id: 'INC-2026-001',
    reporter_name: 'Demo Field Officer (Tenzing Norgay)',
    phone: '+91 98123 45678',
    incident_type: 'landslide',
    description: 'Minor rockfall and mud accumulation on left lane near Mawlai Bypass. Traffic slowed.',
    lat: 25.5922,
    lon: 91.8794,
    status: 'VERIFIED',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'INC-2026-002',
    reporter_name: 'Local User (Sanjay Das)',
    phone: '+91 98765 11223',
    incident_type: 'road_blocked',
    description: 'Fallen electric pole blocking two-wheeler passage near Sonapur Tunnel south entrance.',
    lat: 25.5788,
    lon: 91.8933,
    status: 'SUBMITTED',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'INC-2026-003',
    reporter_name: 'Demo Driver (Ramesh Kumar)',
    phone: '+91 98765 43210',
    incident_type: 'vibration',
    description: 'Severe road tremor and slope vibration felt during heavy rain near Nongpoh.',
    lat: 25.9011,
    lon: 91.8800,
    status: 'RESOLVED',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
];

export const incidentsApi = {
  getIncidents: async (): Promise<IncidentReport[]> => {
    try {
      const response = await apiClient.get<IncidentReport[]>('/api/reports');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return DUMMY_INCIDENTS;
    } catch (_err) {
      return DUMMY_INCIDENTS;
    }
  },

  createIncident: async (incident: IncidentReport): Promise<IncidentReport> => {
    try {
      const formData = new FormData();
      formData.append('reporter_name', incident.reporter_name);
      formData.append('phone', incident.phone || '');
      formData.append('incident_type', incident.incident_type);
      formData.append('description', incident.description || '');
      formData.append('lat', String(incident.lat));
      formData.append('lon', String(incident.lon));

      if (incident.photo_uri) {
        const filename = incident.photo_uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('photo', {
          uri: incident.photo_uri,
          name: filename,
          type: type,
        } as any);
      }

      const response = await apiClient.post<IncidentReport>('/api/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (_err) {
      // Local fallback for offline/demo mode
      const created: IncidentReport = {
        ...incident,
        id: `INC-LOCAL-${Date.now().toString().slice(-4)}`,
        status: 'SUBMITTED',
        timestamp: new Date().toISOString(),
      };
      DUMMY_INCIDENTS.unshift(created);
      return created;
    }
  }
};

