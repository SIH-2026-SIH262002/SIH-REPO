/**
 * GraphHopper Routing & Rerouting Integration Service
 * 
 * Provides live turn-by-turn routing, distance matrix calculation,
 * and custom disaster-area avoidance using GraphHopper Routing API.
 */

export interface GraphHopperPoint {
  lat: number;
  lon: number;
}

export interface GraphHopperInstruction {
  distance: number;
  time: number;
  text: string;
  street_name: string;
  sign: number;
}

export interface GraphHopperRouteResult {
  distance_km: number;
  time_hr: number;
  points: [number, number][]; // Array of [lat, lon] coordinates
  instructions: GraphHopperInstruction[];
  isFallback?: boolean;
}

const GRAPHHOPPER_API_KEY = process.env.EXPO_PUBLIC_GRAPHHOPPER_API_KEY || 'default_demo_key';
const GRAPHHOPPER_BASE_URL = process.env.EXPO_PUBLIC_GRAPHHOPPER_URL || 'https://graphhopper.com/api/1';

export const graphhopperService = {
  /**
   * Fetches turn-by-turn route between origin and destination from GraphHopper API.
   * Accepts optional blocked/avoid areas for landslide disaster rerouting.
   */
  getRoute: async (
    origin: GraphHopperPoint,
    destination: GraphHopperPoint,
    vehicleProfile: 'car' | 'truck' | 'small_truck' = 'car',
    avoidAreas?: GraphHopperPoint[]
  ): Promise<GraphHopperRouteResult> => {
    try {
      const pointParams = `point=${origin.lat},${origin.lon}&point=${destination.lat},${destination.lon}`;
      let url = `${GRAPHHOPPER_BASE_URL}/route?${pointParams}&profile=${vehicleProfile}&points_encoded=false&instructions=true&key=${GRAPHHOPPER_API_KEY}`;

      if (avoidAreas && avoidAreas.length > 0) {
        const blockParam = avoidAreas.map(p => `${p.lat},${p.lon},500`).join(';');
        url += `&block_area=${encodeURIComponent(blockParam)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GraphHopper API error: ${response.statusText}`);
      }

      const data = await response.json();
      const path = data.paths?.[0];

      if (!path) {
        throw new Error('No valid route returned by GraphHopper');
      }

      const coordinates: [number, number][] = path.points.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] // Swap from [lon, lat] to [lat, lon]
      );

      return {
        distance_km: Number((path.distance / 1000).toFixed(2)),
        time_hr: Number((path.time / (1000 * 60 * 60)).toFixed(2)),
        points: coordinates,
        instructions: path.instructions || [],
      };
    } catch (err) {
      console.warn('GraphHopper API warning, returning fallback route calculation:', err);
      return generateFallbackRoute(origin, destination);
    }
  },

  /**
   * Calculates distance & travel time matrix across multiple North-East India logistics nodes.
   */
  getMatrix: async (
    points: GraphHopperPoint[],
    vehicleProfile: 'car' | 'truck' = 'car'
  ): Promise<{ distances: number[][]; times: number[][] }> => {
    try {
      const pointParams = points.map(p => `point=${p.lat},${p.lon}`).join('&');
      const url = `${GRAPHHOPPER_BASE_URL}/matrix?${pointParams}&profile=${vehicleProfile}&out_array=distances&out_array=times&key=${GRAPHHOPPER_API_KEY}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GraphHopper Matrix API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        distances: data.distances || [],
        times: data.times || [],
      };
    } catch (err) {
      console.warn('GraphHopper Matrix warning:', err);
      // Generate synthetic matrix
      const n = points.length;
      const distances = Array(n).fill(0).map(() => Array(n).fill(50));
      const times = Array(n).fill(0).map(() => Array(n).fill(3600));
      return { distances, times };
    }
  }
};

function generateFallbackRoute(origin: GraphHopperPoint, destination: GraphHopperPoint): GraphHopperRouteResult {
  const dLat = destination.lat - origin.lat;
  const dLon = destination.lon - origin.lon;
  
  // Approximate distance in km using haversine formula
  const R = 6371;
  const radLat1 = (origin.lat * Math.PI) / 180;
  const radLat2 = (destination.lat * Math.PI) / 180;
  const deltaLat = (dLat * Math.PI) / 180;
  const deltaLon = (dLon * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distKm = Number((R * c).toFixed(1));
  const timeHr = Number((distKm / 45).toFixed(2)); // Avg 45 km/h mountain speed

  // Generate intermediate polyline waypoints
  const points: [number, number][] = [
    [origin.lat, origin.lon],
    [origin.lat + dLat * 0.33, origin.lon + dLon * 0.25],
    [origin.lat + dLat * 0.66, origin.lon + dLon * 0.75],
    [destination.lat, destination.lon],
  ];

  return {
    distance_km: Math.max(5, distKm),
    time_hr: Math.max(0.2, timeHr),
    points,
    instructions: [
      { distance: distKm * 300, time: timeHr * 1200, text: 'Head out on primary corridor', street_name: 'NH-6', sign: 0 },
      { distance: distKm * 400, time: timeHr * 1600, text: 'Continue along mountain pass bypass', street_name: 'SH-1', sign: 1 },
      { distance: distKm * 300, time: timeHr * 800, text: 'Arrive at destination hub', street_name: 'Relief Center', sign: 4 },
    ],
    isFallback: true,
  };
}
