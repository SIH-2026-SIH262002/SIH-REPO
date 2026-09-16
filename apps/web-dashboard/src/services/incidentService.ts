import { apiService } from './apiService';

export const incidentService = {
  getIncidents: async (): Promise<any[]> => {
    return apiService.getReports();
  },

  addIncident: async (formData: FormData): Promise<any> => {
    return apiService.submitReport(formData);
  },
};
