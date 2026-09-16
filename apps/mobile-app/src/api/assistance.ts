import { apiClient } from './client';

export interface MobileAssistanceInput {
  category: 'MEDICAL_EMERGENCY' | 'VEHICLE_BREAKDOWN' | 'UNABLE_TO_CONTINUE' | 'HAZARD_BLOCKED' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  vehicleCode?: string;
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
  operationalNotes?: string;
  sosEventId?: number;
}

export const assistanceApi = {
  // Submit new assistance request
  requestAssistance: async (payload: MobileAssistanceInput) => {
    const response = await apiClient.post('/api/assistance', payload);
    return response.data;
  },

  // Get assistance requests
  getMyRequests: async () => {
    const response = await apiClient.get('/api/assistance');
    return response.data;
  },

  // Cancel OPEN assistance request (driver allowed)
  cancelRequest: async (id: number, reason: string) => {
    const response = await apiClient.put(`/api/assistance/${id}/cancel`, { reason });
    return response.data;
  },

  // Accept trip handover assignment (if designated replacement)
  acceptHandover: async (handoverId: number) => {
    const response = await apiClient.put(`/api/handovers/${handoverId}/accept`);
    return response.data;
  },

  // Reject trip handover assignment
  rejectHandover: async (handoverId: number, reason?: string) => {
    const response = await apiClient.put(`/api/handovers/${handoverId}/reject`, { reason });
    return response.data;
  },
};
