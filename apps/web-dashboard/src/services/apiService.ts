import axios from 'axios';

// FastAPI gateway (backend/app) -- operational/simulation domain data
// (sensors, routing, SOS, reports, vehicles, warehouses, notifications, ML
// risk). Identity/session/Admin user-lifecycle calls go through
// api/apiClient.ts against the separate Express auth-service instead.
// VITE_API_URL must include the /api suffix -- see apps/web-dashboard/.env.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Attach the same access token used against the auth-service. Every FastAPI
// route the Admin Console calls now requires a valid Bearer token (a missing
// or invalid one gets 401, not a synthetic identity -- see
// docs/ADMIN_CONSOLE_IMPLEMENTATION_SPEC.md §D item 1), so this interceptor
// is load-bearing, not optional.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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

  // Admin / Emergency Operator only (backend-enforced, see sensors.py)
  injectStorm: async (nodeKey: string, rainfall24h = 120.0, vibration = 4.5) => {
    const response = await apiClient.post('/sensors/inject-storm', {
      node_key: nodeKey,
      rainfall_24h: rainfall24h,
      vibration,
    });
    return response.data;
  },

  // Admin / Emergency Operator only (backend-enforced, see sensors.py)
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

  // Real training-time metrics (MAE, R^2, ROC-AUC) + feature importances
  getModelInfo: async () => {
    const response = await apiClient.get('/risk/model-info');
    return response.data;
  },

  // AI Route Planning
  planRoute: async (origin: string, destination: string, criticalityMultiplier = 1.0) => {
    const response = await apiClient.get('/routes/plan', {
      params: { origin, destination, criticality_multiplier: criticalityMultiplier },
    });
    return response.data;
  },

  getRouteGraph: async () => {
    const response = await apiClient.get('/routes/graph');
    return response.data;
  },

  // Emergency Driver SOS
  triggerSOS: async (sosPayload: Record<string, any>) => {
    const response = await apiClient.post('/sos', sosPayload);
    return response.data;
  },

  // Field Incident Reports & Uploads
  uploadFile: async (formData: FormData) => {
    const response = await apiClient.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  submitReport: async (formData: FormData) => {
    const response = await apiClient.post('/reports', formData);
    return response.data;
  },

  // Operational Intelligence & Impact Chain
  getSupplyGapIntelligence: async () => {
    const response = await apiClient.get('/supply-gaps/intelligence');
    return response.data;
  },

  getWarehouses: async () => {
    const response = await apiClient.get('/warehouses');
    return response.data;
  },

  getIncidentImpactChain: async (incidentId: string) => {
    const response = await apiClient.get(`/incidents/${incidentId}/impact-chain`);
    return response.data;
  },

  // Fleet
  getVehicles: async () => {
    const response = await apiClient.get('/vehicles');
    return response.data;
  },

  // Driver Hazard & Telematics Lifecycle
  getDriverAssignedVehicle: async () => {
    const response = await apiClient.get('/vehicles/me');
    return response.data;
  },

  reportDriverHazard: async (hazardPayload: Record<string, any>) => {
    const response = await apiClient.post('/vehicles/hazard', hazardPayload);
    return response.data;
  },

  updateDeliveryStatus: async (vehicleId: string, status: string, notes?: string) => {
    const response = await apiClient.post(`/vehicles/${vehicleId}/delivery-status`, { status, notes });
    return response.data;
  },

  confirmDelivery: async (vehicleId: string) => {
    const response = await apiClient.post(`/vehicles/${vehicleId}/delivery-confirm`);
    return response.data;
  },

  // Live Risk Alerts
  getAlerts: async () => {
    const response = await apiClient.get('/alerts');
    return response.data;
  },

  // Emergency SOS Engine (Admin sees all districts; Emergency Operator is
  // filtered server-side to their own district -- see backend/app/routers/sos.py)
  getSOS: async () => {
    const response = await apiClient.get('/sos');
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

  // Thermal budget monitoring (returns null if backend endpoint unavailable)
  getThermalBudget: async (shipmentId: string) => {
    try {
      const response = await apiClient.get(`/shipment/thermal/${shipmentId}`);
      return response.data;
    } catch (err) {
      // Returns null so caller can display NOT CONFIGURED rather than fake data
      return null;
    }
  },

  // Corridor recovery prediction (returns null if backend endpoint unavailable)
  getCorridorRecovery: async (corridorCode: string) => {
    try {
      const response = await apiClient.get(`/recovery/predict`, { params: { corridorCode } });
      return response.data;
    } catch (err) {
      // Returns null so caller can display NOT CONFIGURED rather than fake data
      return null;
    }
  },

  // Logistics Operator Reroute Approval
  approveReroute: async (vehicleId: string, bypassRoute: string, notes?: string) => {
    const response = await apiClient.post(`/vehicles/${vehicleId}/delivery-status`, {
      status: 'IN_TRANSIT',
      notes: `REROUTED via ${bypassRoute}. ${notes || ''}`.trim(),
    });
    return response.data;
  },

  // Service health liveness probe (real; see backend/app/main.py). Registered
  // directly on the app at /api/health, not under a router, but resolves the
  // same way since VITE_API_URL already carries the /api suffix.
  getHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Multilingual Native Localization Support (real backend: backend/app/routers/i18n.py)
  getTranslations: async (lang: string) => {
    try {
      const response = await apiClient.get(`/i18n/${lang}`);
      return response.data;
    } catch (err) {
      // Graceful client-side fallback for static UI strings only -- never
      // used for operational/telemetry data.
      const translations: Record<string, Record<string, string>> = {
        AS: {
          hazard_warning: 'সতৰ্কতা: স্খলনৰ সম্ভাৱনা আছে। বিকল্প পথ ব্যৱহাৰ কৰক।',
          sos_relayed: 'জরুৰীকালীন সাহায্য প্ৰেৰণ কৰা হৈছে।',
        },
        HI: {
          hazard_warning: 'चेतावनी: भूस्खलन का खतरा है। वैकल्पिक मार्ग का उपयोग करें।',
          sos_relayed: 'आपातकालीन सहायता भेजी गई है।',
        },
        EN: {
          hazard_warning: 'WARNING: Landslide risk detected. Use recommended bypass corridor.',
          sos_relayed: 'Emergency response dispatched to your location.',
        },
      };
      return translations[lang] || translations['EN'];
    }
  },
};
