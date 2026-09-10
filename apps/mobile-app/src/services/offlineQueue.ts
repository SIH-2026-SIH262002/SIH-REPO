import AsyncStorage from '@react-native-async-storage/async-storage';
import { IncidentReport } from '../types';

const OFFLINE_QUEUE_KEY = 'ner_logisense_offline_incidents';

export const offlineQueueService = {
  getQueue: async (): Promise<IncidentReport[]> => {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to read offline queue:', e);
      return [];
    }
  },

  enqueue: async (report: IncidentReport): Promise<void> => {
    try {
      const current = await offlineQueueService.getQueue();
      const newItem: IncidentReport = {
        ...report,
        id: report.id || `offline_${Date.now()}`,
        timestamp: report.timestamp || new Date().toISOString(),
        status: 'PENDING',
        syncedLocally: true
      };
      current.push(newItem);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('Failed to enqueue offline incident:', e);
    }
  },

  clearQueue: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (e) {
      console.warn('Failed to clear offline queue:', e);
    }
  },

  removeById: async (id: string): Promise<void> => {
    try {
      const current = await offlineQueueService.getQueue();
      const filtered = current.filter((item) => item.id !== id);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to remove item from offline queue:', e);
    }
  }
};
