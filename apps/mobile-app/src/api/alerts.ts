import { apiClient } from './client';
import { Alert } from '../types';

export const alertsApi = {
  getAlerts: async (activeOnly: boolean = false): Promise<Alert[]> => {
    const response = await apiClient.get<Alert[]>('/api/alerts', {
      params: { active_only: activeOnly }
    });
    return response.data;
  }
};
