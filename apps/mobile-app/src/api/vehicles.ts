import { apiClient } from './client';
import { Vehicle } from '../types';

export const vehiclesApi = {
  getVehicles: async (): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/api/vehicles');
    return response.data;
  }
};
