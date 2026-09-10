import { apiClient } from './client';
import { SensorNode } from '../types';

export const sensorsApi = {
  getSensors: async (): Promise<SensorNode[]> => {
    const response = await apiClient.get<SensorNode[]>('/api/sensors');
    return response.data;
  },

  getSensorByKey: async (nodeKey: string): Promise<SensorNode> => {
    const response = await apiClient.get<SensorNode>(`/api/sensors/${nodeKey}`);
    return response.data;
  }
};
