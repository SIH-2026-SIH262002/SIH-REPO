import { apiService } from './apiService';

export const logisticsService = {
  getEssentialSupplySummary: async (): Promise<any> => {
    return apiService.getSupplyGapIntelligence();
  },
};
