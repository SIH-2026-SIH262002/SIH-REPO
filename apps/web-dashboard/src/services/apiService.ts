import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

export const apiService = {
  // System Dashboard Summary
  getDashboardSummary: async () => {
    const response = await apiClient.get('/dashboard/summary');
    return response.data;
  },

  // Sensor Telemetry
  getSensors: async () => {
    const response = await apiClient.get('/sensors');
    return response.data;
  },

  getSensorNode: async (nodeKey: string) => {
    const response = await apiClient.get(`/sensors/${nodeKey}`);
    return response.data;
  },

  injectStorm: async (nodeKey: string, rainfall24h = 120.0, vibration = 4.5) => {
    const response = await apiClient.post('/sensors/inject-storm', {
      node_key: nodeKey,
      rainfall_24h: rainfall24h,
      vibration,
    });
    return response.data;
  },

  resetScenario: async () => {
    const response = await apiClient.post('/sensors/reset-scenario');
    return response.data;
  },

  // ML Risk Intelligence
  predictRisk: async (sensorData: Record<string, any>) => {
    const response = await apiClient.post('/risk/predict', sensorData);
    return response.data;
  },

  getFeatureImportance: async () => {
    const response = await apiClient.get('/risk/feature-importance');
    return response.data;
  },

  // AI Route Planning
  getRoutePlan: async (origin: string, destination: string, avoidHighRisk = true) => {
    const response = await apiClient.get('/routes/plan', {
      params: { origin, destination, avoid_high_risk: avoidHighRisk },
    });
    return response.data;
  },

  getRouteGraph: async () => {
    const response = await apiClient.get('/routes/graph');
    return response.data;
  },

  // Vehicle Telemetry
  getVehicles: async () => {
    const response = await apiClient.get('/vehicles');
    return response.data;
  },

  // Live Risk Alerts
  getAlerts: async () => {
    const response = await apiClient.get('/alerts');
    return response.data;
  },

  // Emergency SOS Engine
  getSOS: async () => {
    const response = await apiClient.get('/sos');
    return response.data;
  },

  triggerSOS: async (sosPayload: Record<string, any>) => {
    const response = await apiClient.post('/sos', sosPayload);
    return response.data;
  },

  resolveSOS: async (sosId: string, notes?: string) => {
    const response = await apiClient.post(`/sos/${sosId}/resolve`, { notes });
    return response.data;
  },

  // Field Incident Reports
  getReports: async () => {
    const response = await apiClient.get('/reports');
    return response.data;
  },

  submitReport: async (formData: FormData) => {
    const response = await apiClient.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Notifications Outbox & Subscribers
  getOutbox: async () => {
    const response = await apiClient.get('/notify/outbox');
    return response.data;
  },

  getSubscribers: async () => {
    const response = await apiClient.get('/notify/subscribers');
    return response.data;
  },

  addSubscriber: async (phone: string, name: string, isWhatsapp = true) => {
    const response = await apiClient.post('/notify/subscribe', {
      phone,
      name,
      is_whatsapp: isWhatsapp,
    });
    return response.data;
  },
};
