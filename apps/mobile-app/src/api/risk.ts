import { apiClient } from './client';
import { RiskInputPayload, RiskPredictionResult } from '../types';

export const DUMMY_FEATURE_IMPORTANCE: Record<string, number> = {
  soil_moisture_pct: 0.38,
  slope_angle_deg: 0.27,
  rainfall_24h_mm: 0.18,
  vibration_g: 0.10,
  historical_landslide_count: 0.07,
};

export const riskApi = {
  predictRisk: async (payload: RiskInputPayload): Promise<RiskPredictionResult> => {
    try {
      const response = await apiClient.post<RiskPredictionResult>('/api/risk/predict', payload);
      if (response.data && typeof response.data.risk_score === 'number') {
        return response.data;
      }
      return generateDummyRiskPrediction(payload);
    } catch (_err) {
      return generateDummyRiskPrediction(payload);
    }
  },

  getFeatureImportance: async (): Promise<Record<string, number>> => {
    try {
      const response = await apiClient.get<Record<string, number>>('/api/risk/feature-importance');
      if (response.data && Object.keys(response.data).length > 0) {
        return response.data;
      }
      return DUMMY_FEATURE_IMPORTANCE;
    } catch (_err) {
      return DUMMY_FEATURE_IMPORTANCE;
    }
  }
};

function generateDummyRiskPrediction(payload: RiskInputPayload): RiskPredictionResult {
  const moisture = payload.soil_moisture_pct ?? 45;
  const slope = payload.slope_angle_deg ?? 30;
  const rain = payload.rainfall_mm_last_24h ?? 50;

  // Simple heuristic calculation for fallback prediction
  let calculatedScore = Math.min(99.9, Math.max(5.0, (moisture * 0.4) + (slope * 0.8) + (rain * 0.3)));
  let category: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE' = 'LOW';

  if (calculatedScore >= 75) category = 'SEVERE';
  else if (calculatedScore >= 60) category = 'HIGH';
  else if (calculatedScore >= 35) category = 'MODERATE';

  return {
    risk_score: Number(calculatedScore.toFixed(1)),
    category,
    recommendations: [
      'Reduce vehicle transit speed under 35 km/h along mountain cut sections.',
      'Deploy localized IoT moisture sensor array for continuous telemetry.',
      'Establish emergency communication link with regional disaster relief depot.',
    ],
    contributing_factors: [
      { factor: 'Soil Moisture Level', impact: `${moisture}% saturation` },
      { factor: 'Geological Slope Angle', impact: `${slope}° steep gradient` },
      { factor: 'Accumulated Rainfall (24h)', impact: `${rain} mm precip` },
    ],
    timestamp: new Date().toISOString(),
  };
}

