import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPendingSyncCount, getPendingSyncItems, markSyncItemCompleted } from '@/lib/db';
import { ashaApi } from '@/api/ashaApi';

export type NetworkState = 'ONLINE' | 'OFFLINE' | 'SYNCING';

interface ConnectionContextType {
  isOnline: boolean;
  networkState: NetworkState;
  pendingSyncCount: number;
  toggleSimulatedOffline: () => void;
  isSimulatedOffline: boolean;
  syncOfflineQueue: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [browserOnline, setBrowserOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const isOnline = browserOnline && !isSimulatedOffline;

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingSyncCount();
      setPendingSyncCount(count);
    } catch {
      setPendingSyncCount(0);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refreshPendingCount]);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  const syncOfflineQueue = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const pendingItems = await getPendingSyncItems();
      if (pendingItems.length > 0) {
        await ashaApi.pushSyncQueue(pendingItems);
        for (const item of pendingItems) {
          await markSyncItemCompleted(item.id);
        }
      }
      await refreshPendingCount();
    } catch (e) {
      console.error('Failed to sync offline items', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const networkState: NetworkState = isSyncing ? 'SYNCING' : isOnline ? 'ONLINE' : 'OFFLINE';

  return (
    <ConnectionContext.Provider
      value={{
        isOnline,
        networkState,
        pendingSyncCount,
        toggleSimulatedOffline,
        isSimulatedOffline,
        syncOfflineQueue,
        refreshPendingCount,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

const defaultConnectionContext: ConnectionContextType = {
  isOnline: true,
  networkState: 'ONLINE',
  pendingSyncCount: 0,
  toggleSimulatedOffline: () => {},
  isSimulatedOffline: false,
  syncOfflineQueue: async () => {},
  refreshPendingCount: async () => {},
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  return context || defaultConnectionContext;
};
