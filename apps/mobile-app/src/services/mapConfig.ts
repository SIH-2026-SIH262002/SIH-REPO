/**
 * MapmyIndia (Mappls) & GIS Map Service API Configuration Module
 * 
 * Configures Mappls SDK licenses, REST API Keys, Client Credentials,
 * and license configuration file parameters (e.g. app1789146969810i1433472883.a.conf).
 */

export interface MapApiConfig {
  useMappls: boolean;
  provider: 'mappls' | 'mapbox' | 'google' | 'osm';
  restApiKey: string;
  clientId: string;
  clientSecret: string;
  sdkKey: string;
  configFile: string;
  appId: string;
  defaultRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export const MAP_CONFIG: MapApiConfig = {
  useMappls: process.env.EXPO_PUBLIC_USE_MAPPLS === 'true',
  provider: (process.env.EXPO_PUBLIC_MAP_PROVIDER as any) || 'mappls',
  restApiKey: process.env.EXPO_PUBLIC_MAPPLS_REST_KEY || '2381e4b971a8128362b5b5ec157a918a',
  clientId: process.env.EXPO_PUBLIC_MAPPLS_CLIENT_ID || '33OkC8W7a72-s02z-MapplsClientKey',
  clientSecret: process.env.EXPO_PUBLIC_MAPPLS_CLIENT_SECRET || 'lrLd978a_MapplsSecretKey',
  sdkKey: process.env.EXPO_PUBLIC_MAPPLS_SDK_KEY || 'app1789146969810i1433472883',
  configFile: 'app1789146969810i1433472883.a.conf',
  appId: 'app1789146969810i1433472883',
  defaultRegion: {
    latitude: 25.5788,
    longitude: 91.8933,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  },
};

/**
 * Initializes Mappls SDK if available in the current runtime environment.
 */
export function initMapplsSDK() {
  try {
    if (MAP_CONFIG.useMappls) {
      const MapplsGL = require('mappls-map-react-native');
      if (MapplsGL && MapplsGL.setRestApiKey) {
        MapplsGL.setRestApiKey(MAP_CONFIG.restApiKey);
      }
      if (MapplsGL && MapplsGL.setClientId) {
        MapplsGL.setClientId(MAP_CONFIG.clientId);
      }
      if (MapplsGL && MapplsGL.setClientSecret) {
        MapplsGL.setClientSecret(MAP_CONFIG.clientSecret);
      }
      return MapplsGL;
    }
  } catch (err) {
    console.warn('Mappls SDK initialization notice:', err);
  }
  return null;
}
