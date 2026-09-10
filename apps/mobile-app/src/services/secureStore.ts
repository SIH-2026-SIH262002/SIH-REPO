import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'ner_logisense_access_token';
const REFRESH_KEY = 'ner_logisense_refresh_token';
const USER_KEY = 'ner_logisense_user_data';

// Web in-memory fallback
const memoryStorage: Record<string, string> = {};

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return memoryStorage[key] || localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn(`SecureStore getItem error for ${key}:`, e);
      return memoryStorage[key] || null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        memoryStorage[key] = value;
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn(`SecureStore setItem error for ${key}:`, e);
      memoryStorage[key] = value;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        delete memoryStorage[key];
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn(`SecureStore deleteItem error for ${key}:`, e);
      delete memoryStorage[key];
    }
  },

  getToken: () => secureStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => secureStorage.setItem(TOKEN_KEY, token),
  removeToken: () => secureStorage.removeItem(TOKEN_KEY),

  getRefreshToken: () => secureStorage.getItem(REFRESH_KEY),
  setRefreshToken: (token: string) => secureStorage.setItem(REFRESH_KEY, token),
  removeRefreshToken: () => secureStorage.removeItem(REFRESH_KEY),

  getUser: async () => {
    const data = await secureStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },
  setUser: (user: any) => secureStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => secureStorage.removeItem(USER_KEY),

  clearAll: async () => {
    await secureStorage.removeToken();
    await secureStorage.removeRefreshToken();
    await secureStorage.removeUser();
  }
};
