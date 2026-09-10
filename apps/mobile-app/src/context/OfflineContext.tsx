import React, { createContext, useContext, useState, useEffect } from 'react';
import { offlineQueueService } from '../services/offlineQueue';
import { incidentsApi } from '../api/incidents';
import { IncidentReport } from '../types';

interface OfflineContextType {
  pendingCount: number;
  isSyncing: boolean;
  syncOfflineQueue: () => Promise<void>;
  enqueueReport: (report: IncidentReport) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    checkQueue();
  }, []);

  const checkQueue = async () => {
    const queue = await offlineQueueService.getQueue();
    setPendingCount(queue.length);
  };

  const enqueueReport = async (report: IncidentReport) => {
    await offlineQueueService.enqueue(report);
    await checkQueue();
    // Try immediate sync
    syncOfflineQueue();
  };

  const syncOfflineQueue = async () => {
    const queue = await offlineQueueService.getQueue();
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    try {
      for (const item of queue) {
        try {
          await incidentsApi.createIncident(item);
          if (item.id) {
            await offlineQueueService.removeById(item.id);
          }
        } catch (e) {
          console.warn(`Failed to sync incident report ${item.id}:`, e);
          // Keep in queue for next retry
        }
      }
    } finally {
      await checkQueue();
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        pendingCount,
        isSyncing,
        syncOfflineQueue,
        enqueueReport,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
