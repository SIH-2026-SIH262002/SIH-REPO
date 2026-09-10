import { apiClient } from './client';
import { IncidentReport } from '../types';

export const incidentsApi = {
  getIncidents: async (): Promise<IncidentReport[]> => {
    const response = await apiClient.get<IncidentReport[]>('/api/reports');
    return response.data;
  },

  createIncident: async (incident: IncidentReport): Promise<IncidentReport> => {
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
  }
};
