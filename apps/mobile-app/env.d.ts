declare module 'expo-status-bar';
declare module 'expo-location';
declare module 'expo-image-picker';

namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
  }
}
