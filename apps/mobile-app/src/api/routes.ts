import { apiClient } from './client';
import { graphhopperService, GraphHopperPoint, GraphHopperRouteResult } from '../services/graphhopperService';

export const routesApi = {
  getNodes: async () => {
    try {
      const response = await apiClient.get('/api/routes/nodes');
      return response.data;
    } catch (_err) {
      return null;
    }
  },

  getGraphSnapshot: async () => {
    try {
      const response = await apiClient.get('/api/routes/graph');
      return response.data;
    } catch (_err) {
      return null;
    }
  },

  planRoute: async (
    origin: string,
    destination: string,
    k: number = 3,
    options?: { avoidSteepRoads?: boolean }
  ) => {
    try {
      const response = await apiClient.get('/api/routes/plan', {
        params: { origin, destination, k, avoid_steep_roads: options?.avoidSteepRoads || undefined }
      });
      return response.data;
    } catch (_err) {
      return null;
    }
  },

  /**
   * GraphHopper turn-by-turn routing & disaster zone rerouting integration
   */
  planGraphHopperRoute: async (
    origin: GraphHopperPoint,
    destination: GraphHopperPoint,
    vehicleProfile: 'car' | 'truck' = 'car',
    avoidAreas?: GraphHopperPoint[]
  ): Promise<GraphHopperRouteResult> => {
    return graphhopperService.getRoute(origin, destination, vehicleProfile, avoidAreas);
  }
};

