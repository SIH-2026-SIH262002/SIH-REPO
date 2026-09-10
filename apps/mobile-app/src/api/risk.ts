import { apiClient } from './client';
import { RiskInputPayload, RiskPredictionResult } from '../types';

export const riskApi = {
  predictRisk: async (payload: RiskInputPayload): Promise<RiskPredictionResult> => {
    const response = await apiClient.post<RiskPredictionResult>('/api/risk/predict', payload);
    return response.data;
  },

  getFeatureImportance: async (): Promise<Record<string, number>> => {
    const response = await apiClient.get<Record<string, number>>('/api/risk/feature-importance');
    return response.data;
  }
};
