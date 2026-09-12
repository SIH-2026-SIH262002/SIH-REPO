import * as Location from 'expo-location';

export interface GPSPosition {
  lat: number;
  lon: number;
  accuracy?: number | null;
}

// Default fallback location: Shillong, Meghalaya (North Eastern Region center)
export const DEFAULT_NER_LOCATION: GPSPosition = {
  lat: 25.5788,
  lon: 91.8933,
};

export const locationService = {
  requestPermission: async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.warn('Error requesting location permission:', e);
      return false;
    }
  },

  getCurrentLocation: async (): Promise<GPSPosition> => {
    try {
      const hasPermission = await locationService.requestPermission();
      if (!hasPermission) {
        console.log('Location permission not granted, using fallback NER position');
        return DEFAULT_NER_LOCATION;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (e) {
      console.log('Location unavailable, falling back to default NER location (Shillong)');
      return DEFAULT_NER_LOCATION;
    }
  }
};
