/**
 * driverOpsApi.ts — Logistics Operator: Driver Operations & Safe Trip Continuity API client
 *
 * Direct communication with Spring Boot core-service (VITE_CORE_URL / localhost:8080).
 * Core-service owns persistent business state in PostgreSQL for DriverProfile, AssistanceRequest, and TripHandover.
 */
import axios from 'axios';

const CORE_BASE = (import.meta as any).env?.VITE_CORE_URL || 'http://localhost:8080';

const coreClient = axios.create({
  baseURL: CORE_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

coreClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface DriverUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  district?: string;
}

export interface DriverProfile {
  id: number;
  user: DriverUser;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry?: string;
  operationalStatus: 'REGISTERED' | 'VERIFIED' | 'ACTIVE' | 'ON_TRIP' | 'HANDOVER_REQUIRED' | 'OFF_DUTY' | 'SUSPENDED';
  fitnessStatus: 'FIT' | 'UNABLE_TO_CONTINUE' | 'RESTRICTED_DUTY';
  baseDepot?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  assignedVehicleCode?: string;
  activeShipmentId?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt?: string;
}

export interface AssistanceRequest {
  id: number;
  requestNumber: string;
  driver: DriverProfile;
  vehicleCode?: string;
  shipmentId?: number;
  sosEventId?: number;
  category: 'MEDICAL_EMERGENCY' | 'VEHICLE_BREAKDOWN' | 'UNABLE_TO_CONTINUE' | 'HAZARD_BLOCKED' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'ASSISTANCE_DISPATCHED' | 'HANDOVER_REQUESTED' | 'RESOLVED' | 'CANCELLED';
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
  operationalNotes?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  dispatchedAction?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface CandidateDriver {
  driverId: number;
  username: string;
  fullName: string;
  phoneNumber?: string;
  licenseNumber: string;
  licenseCategory: string;
  baseDepot?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  distanceKm: number; // Real road distance via GraphHopper
  etaMinutes?: number; // Real travel duration via GraphHopper
  riskLevel: string; // LOW, MODERATE, HIGH, CRITICAL
  compositeScore: number;
  isFallbackEstimate: boolean;
}

export interface TripHandover {
  id: number;
  handoverNumber: string;
  assistanceRequestId?: number;
  shipmentId: number;
  vehicleCode: string;
  originalDriver: DriverProfile;
  replacementDriver?: DriverProfile;
  handoverLocationType: 'CURRENT_VEHICLE_LOCATION' | 'SAFE_HANDOVER_POINT';
  handoverLatitude: number;
  handoverLongitude: number;
  handoverLocationName: string;
  estimatedDistanceKm?: number;
  estimatedArrivalMinutes?: number;
  isFallbackEstimate?: boolean;
  status: 'PENDING_REPLACEMENT' | 'REPLACEMENT_OFFERED' | 'ACCEPTED' | 'IN_TRANSIT_TO_HANDOVER' | 'ARRIVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  cargoSealVerified: boolean;
  keysTransferred: boolean;
  vehicleInspectionPassed: boolean;
  handoverNotes?: string;
  initiatedBy?: string;
  completedAt?: string;
  createdAt: string;
}

export interface HandoverChecklist {
  cargoSealVerified: boolean;
  keysTransferred: boolean;
  vehicleInspectionPassed: boolean;
  notes?: string;
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export const driverOpsApi = {
  // Drivers
  getDrivers: async (): Promise<DriverProfile[]> => {
    const res = await coreClient.get('/api/drivers');
    return res.data;
  },

  getAvailableDrivers: async (category?: string): Promise<DriverProfile[]> => {
    const res = await coreClient.get('/api/drivers/available', {
      params: category ? { requiredCategory: category } : {},
    });
    return res.data;
  },

  getDriverById: async (id: number): Promise<DriverProfile> => {
    const res = await coreClient.get(`/api/drivers/${id}`);
    return res.data;
  },

  registerDriver: async (data: {
    userId?: number;
    username?: string;
    licenseNumber: string;
    licenseCategory: string;
    licenseExpiry?: string;
    baseDepot?: string;
    assignedVehicleCode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  }): Promise<DriverProfile> => {
    const res = await coreClient.post('/api/drivers', data);
    return res.data;
  },

  updateDriverStatus: async (id: number, status: string): Promise<DriverProfile> => {
    const res = await coreClient.put(`/api/drivers/${id}/status`, { status });
    return res.data;
  },

  updateDriverFitness: async (id: number, fitnessStatus: string): Promise<DriverProfile> => {
    const res = await coreClient.put(`/api/drivers/${id}/fitness`, { fitnessStatus });
    return res.data;
  },

  // Assistance Requests
  getAssistanceRequests: async (status?: string): Promise<AssistanceRequest[]> => {
    const res = await coreClient.get('/api/assistance', {
      params: status ? { status } : {},
    });
    return res.data;
  },

  getAssistanceById: async (id: number): Promise<AssistanceRequest> => {
    const res = await coreClient.get(`/api/assistance/${id}`);
    return res.data;
  },

  createAssistanceRequest: async (data: {
    driverId?: number;
    vehicleCode?: string;
    shipmentId?: number;
    category: string;
    severity: string;
    latitude?: number;
    longitude?: number;
    locationDescription?: string;
    operationalNotes?: string;
  }): Promise<AssistanceRequest> => {
    const res = await coreClient.post('/api/assistance', data);
    return res.data;
  },

  acknowledgeAssistance: async (id: number): Promise<AssistanceRequest> => {
    const res = await coreClient.put(`/api/assistance/${id}/acknowledge`);
    return res.data;
  },

  dispatchAssistance: async (id: number, dispatchedAction: string): Promise<AssistanceRequest> => {
    const res = await coreClient.put(`/api/assistance/${id}/dispatch`, { dispatchedAction });
    return res.data;
  },

  cancelAssistance: async (id: number, reason: string): Promise<AssistanceRequest> => {
    const res = await coreClient.put(`/api/assistance/${id}/cancel`, { reason });
    return res.data;
  },

  resolveAssistance: async (id: number, resolutionNotes?: string): Promise<AssistanceRequest> => {
    const res = await coreClient.put(`/api/assistance/${id}/resolve`, { resolutionNotes });
    return res.data;
  },

  // Trip Handovers
  getHandovers: async (all = false): Promise<TripHandover[]> => {
    const res = await coreClient.get('/api/handovers', { params: { all } });
    return res.data;
  },

  getHandoverById: async (id: number): Promise<TripHandover> => {
    const res = await coreClient.get(`/api/handovers/${id}`);
    return res.data;
  },

  getCandidates: async (handoverId: number): Promise<CandidateDriverDto[]> => {
    const res = await coreClient.get(`/api/handovers/${handoverId}/candidates`);
    return res.data;
  },

  initiateHandover: async (data: {
    shipmentId: number;
    vehicleCode?: string;
    originalDriverId?: number;
    assistanceRequestId?: number;
    handoverLocationType: 'CURRENT_VEHICLE_LOCATION' | 'SAFE_HANDOVER_POINT';
    handoverLatitude?: number;
    handoverLongitude?: number;
    handoverLocationName?: string;
    handoverNotes?: string;
  }): Promise<TripHandover> => {
    const res = await coreClient.post('/api/handovers', data);
    return res.data;
  },

  assignReplacement: async (handoverId: number, replacementDriverId: number): Promise<TripHandover> => {
    const res = await coreClient.put(`/api/handovers/${handoverId}/assign`, { replacementDriverId });
    return res.data;
  },

  completeHandover: async (handoverId: number, checklist: HandoverChecklist): Promise<TripHandover> => {
    const res = await coreClient.put(`/api/handovers/${handoverId}/complete`, checklist);
    return res.data;
  },
};
