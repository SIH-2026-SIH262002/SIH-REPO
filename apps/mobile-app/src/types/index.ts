export type Role = 'FIELD_OFFICER' | 'LOGISTICS_OPERATOR' | 'DISTRICT_AUTHORITY' | 'ADMIN' | 'SUPER_ADMIN' | 'DRIVER';

export interface User {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  district?: string;
  organization?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
  user: User;
}

export type RiskCategory = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export interface DistrictStatus {
  district: string;
  state: string;
  node_name: string;
  risk_score: number;
  category: RiskCategory;
  storm_event?: boolean;
  manually_flagged?: boolean;
}

export interface Alert {
  id: string;
  type: string;
  severity: RiskCategory;
  location: string;
  timestamp: string;
  description: string;
  active: boolean;
  district?: string;
}

export interface DashboardSummary {
  nodes_by_category: Record<RiskCategory, number>;
  total_nodes: number;
  flagged_corridors: number;
  blocked_corridors: number;
  active_alerts: number;
  total_alerts_logged: number;
  open_sos: number;
  vehicles_total: number;
  vehicles_by_status: Record<string, number>;
  district_status: DistrictStatus[];
  recent_alerts: Alert[];
}

export interface SensorNode {
  key?: string;
  node_key?: string;
  sensor_node_id?: string;
  name: string;
  district: string;
  state: string;
  lat: float;
  lon: float;
  elevation_m: number;
  slope_angle_deg: number;
  soil_type: string;
  rainfall_mm_last_24h: number;
  rainfall_mm_last_72h: number;
  days_since_last_rainfall: number;
  temperature_c: number;
  humidity_pct: number;
  soil_moisture_pct: number;
  soil_porosity_index: number;
  vibration_intensity: number;
  vegetation_cover_pct: number;
  distance_to_stream_km: number;
  historical_landslide_count: number;
  risk_score: number;
  category: RiskCategory;
  storm_event?: boolean;
  manual_flag?: string;
}

type float = number;

export interface RiskInputPayload {
  rainfall_mm_last_24h: number;
  rainfall_mm_last_72h: number;
  days_since_last_rainfall?: number;
  temperature_c?: number;
  humidity_pct?: number;
  soil_moisture_pct: number;
  soil_porosity_index: number;
  vibration_intensity: number;
  slope_angle_deg: number;
  vegetation_cover_pct?: number;
  distance_to_stream_km?: number;
  historical_landslide_count?: number;
  elevation_m?: number;
  soil_type?: string;
}

export interface RiskPredictionResult {
  risk_score: number;
  category: RiskCategory;
  recommendations: string[];
  contributing_factors: Array<{ factor: string; impact: string }>;
  timestamp: string;
}

export interface Vehicle {
  id: string;
  driver_name: string;
  phone: string;
  lat: number;
  lon: number;
  status: 'EN_ROUTE' | 'IDLE' | 'DELAYED' | 'EMERGENCY' | 'COMPLETED';
  current_route?: string;
  speed_kmh?: number;
  destination?: string;
  cargo_type?: string;
  last_updated?: string;
}

export interface IncidentReport {
  id?: string;
  reporter_name: string;
  phone?: string;
  incident_type: 'landslide' | 'flood' | 'road_blocked' | 'vibration' | 'other';
  description: string;
  lat: number;
  lon: number;
  photo_path?: string | null;
  photo_uri?: string | null;
  timestamp?: string;
  status?: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'RESOLVED';
  syncedLocally?: boolean;
}

export interface SOSEvent {
  id: string;
  vehicle_id?: string | null;
  driver_name: string;
  phone: string;
  lat: number;
  lon: number;
  issue_type: string;
  message: string;
  status: 'OPEN' | 'RESOLVED';
  timestamp: string;
}

export interface SOSPayload {
  vehicle_id?: string;
  driver_name: string;
  phone: string;
  lat: number;
  lon: number;
  issue_type?: string;
  message?: string;
}
