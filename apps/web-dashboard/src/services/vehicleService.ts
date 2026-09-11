import { apiService } from './apiService';
import { Vehicle } from '../types/vehicle';

export const vehicleService = {
  getVehicles: async (): Promise<Vehicle[]> => {
    return apiService.getVehicles();
  },

  getVehicleById: async (id: string): Promise<Vehicle | undefined> => {
    const list = await apiService.getVehicles();
    return list.find((v: any) => v.id === id || v.code === id);
  },

  updateVehicleStatus: async (
    id: string,
    status: string,
    notes?: string
  ): Promise<any> => {
    return apiService.updateDeliveryStatus(id, status, notes);
  },
};
