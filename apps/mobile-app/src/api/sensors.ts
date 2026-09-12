import { apiClient } from './client';
import { SensorNode } from '../types';

export const DUMMY_SENSORS: SensorNode[] = [
  {
    key: 'SS-04',
    name: 'Sonapur Tunnel Slope Sensor',
    district: 'East Jaintia Hills',
    state: 'Meghalaya',
    lat: 25.5788,
    lon: 91.8933,
    elevation_m: 1250,
    slope_angle_deg: 42,
    soil_type: 'Clay Loam',
    rainfall_mm_last_24h: 110,
    rainfall_mm_last_72h: 240,
    days_since_last_rainfall: 0,
    temperature_c: 21,
    humidity_pct: 92,
    soil_moisture_pct: 84,
    soil_porosity_index: 0.45,
    vibration_intensity: 0.42,
    vegetation_cover_pct: 35,
    distance_to_stream_km: 0.2,
    historical_landslide_count: 5,
    risk_score: 88.5,
    category: 'SEVERE',
  },
  {
    key: 'GHY-02',
    name: 'Jalukbari Transport Node',
    district: 'Kamrup Metro',
    state: 'Assam',
    lat: 26.1445,
    lon: 91.7362,
    elevation_m: 55,
    slope_angle_deg: 15,
    soil_type: 'Alluvial',
    rainfall_mm_last_24h: 72,
    rainfall_mm_last_72h: 130,
    days_since_last_rainfall: 0,
    temperature_c: 29,
    humidity_pct: 85,
    soil_moisture_pct: 65,
    soil_porosity_index: 0.38,
    vibration_intensity: 0.18,
    vegetation_cover_pct: 50,
    distance_to_stream_km: 0.8,
    historical_landslide_count: 2,
    risk_score: 61.8,
    category: 'HIGH',
  },
  {
    key: 'JOW-01',
    name: 'Jowai Ridge Monitoring Unit',
    district: 'West Jaintia Hills',
    state: 'Meghalaya',
    lat: 25.4411,
    lon: 92.2033,
    elevation_m: 1380,
    slope_angle_deg: 28,
    soil_type: 'Silt Loam',
    rainfall_mm_last_24h: 45,
    rainfall_mm_last_72h: 90,
    days_since_last_rainfall: 1,
    temperature_c: 22,
    humidity_pct: 78,
    soil_moisture_pct: 52,
    soil_porosity_index: 0.32,
    vibration_intensity: 0.12,
    vegetation_cover_pct: 60,
    distance_to_stream_km: 1.2,
    historical_landslide_count: 1,
    risk_score: 48.0,
    category: 'MODERATE',
  },
  {
    key: 'SHL-01',
    name: 'Shillong Peak Array',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    lat: 25.5686,
    lon: 91.8831,
    elevation_m: 1960,
    slope_angle_deg: 22,
    soil_type: 'Sandy Loam',
    rainfall_mm_last_24h: 20,
    rainfall_mm_last_72h: 40,
    days_since_last_rainfall: 2,
    temperature_c: 18,
    humidity_pct: 70,
    soil_moisture_pct: 30,
    soil_porosity_index: 0.25,
    vibration_intensity: 0.05,
    vegetation_cover_pct: 80,
    distance_to_stream_km: 2.0,
    historical_landslide_count: 0,
    risk_score: 22.0,
    category: 'LOW',
  },
];

export const sensorsApi = {
  getSensors: async (): Promise<SensorNode[]> => {
    try {
      const response = await apiClient.get<SensorNode[]>('/api/sensors');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return DUMMY_SENSORS;
    } catch (_err) {
      return DUMMY_SENSORS;
    }
  },

  getSensorByKey: async (nodeKey: string): Promise<SensorNode> => {
    try {
      const response = await apiClient.get<SensorNode>(`/api/sensors/${nodeKey}`);
      if (response.data && response.data.key) {
        return response.data;
      }
      const match = DUMMY_SENSORS.find((s) => s.key === nodeKey || s.name.includes(nodeKey));
      return match || DUMMY_SENSORS[0];
    } catch (_err) {
      const match = DUMMY_SENSORS.find((s) => s.key === nodeKey || s.name.includes(nodeKey));
      return match || DUMMY_SENSORS[0];
    }
  }
};

