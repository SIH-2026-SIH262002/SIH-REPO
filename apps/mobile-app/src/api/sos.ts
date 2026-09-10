import { apiClient } from './client';
import { SOSEvent, SOSPayload } from '../types';

export const sosApi = {
  triggerSOS: async (payload: SOSPayload): Promise<{ event: SOSEvent; notifications?: any[] }> => {
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
  },

  listSOS: async (): Promise<SOSEvent[]> => {
    const response = await apiClient.get<SOSEvent[]>('/api/sos');
    return response.data;
  },

  resolveSOS: async (sosId: string): Promise<SOSEvent> => {
    const response = await apiClient.post<SOSEvent>(`/api/sos/${sosId}/resolve`);
    return response.data;
  }
};
