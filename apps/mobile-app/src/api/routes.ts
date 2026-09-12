import { apiClient } from './client';

export const routesApi = {
  getNodes: async () => {
    const response = await apiClient.get('/api/routes/nodes');
    return response.data;
  },

  getGraphSnapshot: async () => {
    const response = await apiClient.get('/api/routes/graph');
    return response.data;
  },

  planRoute: async (
    origin: string,
    destination: string,
    k: number = 3,
    options?: { avoidSteepRoads?: boolean }
  ) => {
    const response = await apiClient.get('/api/routes/plan', {
      params: { origin, destination, k, avoid_steep_roads: options?.avoidSteepRoads || undefined }
    });
    return response.data;
  }
};
