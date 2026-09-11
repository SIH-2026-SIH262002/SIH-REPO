import { apiService } from './apiService';

export const districtService = {
  getDistricts: async (): Promise<any[]> => {
    const res = await apiService.getDashboardSummary();
    return res.district_status || [];
  },
};
