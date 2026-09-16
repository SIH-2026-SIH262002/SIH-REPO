/**
 * sosApi.ts — Emergency Operator: SOS & Emergency Resource API client
 *
 * All calls go to the Spring Boot core-service (VITE_CORE_URL / localhost:8080).
 * The FastAPI gateway (VITE_API_URL) handles sensors/vehicles/SOS-trigger from
 * drivers — the core-service owns the SOS workflow for operators.
 */
import axios from 'axios';

const CORE_BASE = (import.meta as any).env?.VITE_CORE_URL || 'http://localhost:8080';

// Axios instance for core-service, attaches the same JWT stored by apiClient
const coreClient = axios.create({
  baseURL: CORE_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

coreClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type SosStatus =
  | 'TRIGGERED'
  | 'RECEIVED'
  | 'ACKNOWLEDGED'
  | 'RESPONDER_ASSIGNED'
  | 'RESOLVED'
  | 'FALSE_ALARM';

export type SosDeliveryType = 'DIRECT_CELLULAR' | 'MESH_RELAY_STORE_FORWARD';

export interface SosEvent {
  id: number;
  meshPacketId?: string;
  triggeredBy: string;
  vehicleCode?: string;
  latitude?: number;
  longitude?: number;
  emergencyType?: string;
  district?: string;
  message?: string;
  status: SosStatus;
  assignedResponder?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  deliveryType: SosDeliveryType;
  relayedByVehicle?: string;
  relayHopCount?: number;
  relayLatencyMinutes?: number;
  pathAccumulator?: string;
  crcChecksum?: string;
  originTimestamp?: string;
  createdAt?: string;
}

export type ResourceStatus = 'AVAILABLE' | 'ASSIGNED' | 'EN_ROUTE' | 'BUSY' | 'UNAVAILABLE';
export type ResourceType = 'RESCUE_TEAM' | 'AMBULANCE' | 'HEAVY_EQUIPMENT' | 'PERSONNEL';

export interface EmergencyResource {
  resourceId: string;
  name: string;
  resourceType: ResourceType;
  status: ResourceStatus;
  assignedSosId?: string;
  baseLocation?: string;
  contactPhone?: string;
}

// ─── SOS Endpoints ───────────────────────────────────────────────────────────

export const sosApi = {
  /**
   * GET /api/sos/active
   * Returns all non-RESOLVED SOS events.
   * EMERGENCY_OPERATOR role is automatically district-scoped by the backend.
   */
  getActiveSos: async (): Promise<SosEvent[]> => {
    const res = await coreClient.get<SosEvent[]>('/api/sos/active');
    return res.data;
  },

  /**
   * GET /api/sos/{id}
   */
  getSosById: async (id: number): Promise<SosEvent> => {
    const res = await coreClient.get<SosEvent>(`/api/sos/${id}`);
    return res.data;
  },

  /**
   * PUT /api/sos/{id}/acknowledge
   * Requires SOS_ACKNOWLEDGE permission (EMERGENCY_OPERATOR has it).
   */
  acknowledgeSos: async (id: number): Promise<SosEvent> => {
    const res = await coreClient.put<SosEvent>(`/api/sos/${id}/acknowledge`);
    return res.data;
  },

  /**
   * PUT /api/sos/{id}/assign?responderName=...
   * Requires SOS_DISPATCH permission.
   */
  assignResponder: async (id: number, responderName: string): Promise<SosEvent> => {
    const res = await coreClient.put<SosEvent>(`/api/sos/${id}/assign`, null, {
      params: { responderName },
    });
    return res.data;
  },

  /**
   * PUT /api/sos/{id}/resolve?resolutionNotes=...
   * Requires SOS_RESOLVE permission.
   */
  resolveSos: async (id: number, resolutionNotes: string): Promise<SosEvent> => {
    const res = await coreClient.put<SosEvent>(`/api/sos/${id}/resolve`, null, {
      params: { resolutionNotes },
    });
    return res.data;
  },

  /**
   * GET /api/sos/acks
   */
  getAcks: async () => {
    const res = await coreClient.get('/api/sos/acks');
    return res.data;
  },
};

// ─── Emergency Resource Endpoints ────────────────────────────────────────────

export const resourceApi = {
  /**
   * GET /api/emergency/resources
   * Requires EMERGENCY_RESOURCE_VIEW or SOS_VIEW.
   */
  getResources: async (): Promise<EmergencyResource[]> => {
    const res = await coreClient.get<EmergencyResource[]>('/api/emergency/resources');
    return res.data;
  },

  /**
   * POST /api/emergency/resources/{resourceId}/assign-sos/{sosId}
   * Requires SOS_DISPATCH or EMERGENCY_RESOURCE_MANAGE.
   * Returns 409 if resource already assigned to a different SOS.
   */
  assignResourceToSos: async (
    resourceId: string,
    sosId: number,
  ): Promise<{ status: string; resourceId: string; assignedSosId: string; message: string }> => {
    const res = await coreClient.post(`/api/emergency/resources/${resourceId}/assign-sos/${sosId}`);
    return res.data;
  },
};
