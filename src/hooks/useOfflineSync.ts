import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineStorage } from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  syncError: string | null;
}

export function useOfflineSync() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncedAt: null,
    syncError: null,
  });
  const syncInProgress = useRef(false);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineStorage.getPendingCount();
      setSyncState(prev => ({ ...prev, pendingCount: count }));
    } catch (error) {
      console.error('Error getting pending count:', error);
    }
  }, []);

  // Sync a single operation to Supabase
  const syncOperation = async (op: any): Promise<boolean> => {
    try {
      switch (op.type) {
        case 'create': {
          const { error } = await supabase
            .from(op.table)
            .insert(op.data);
          if (error) throw error;
          // Remove from local records after successful sync
          await offlineStorage.deleteLocalRecord(op.table, op.data.id);
          break;
        }
        case 'update': {
          const { error } = await supabase
            .from(op.table)
            .update(op.data)
            .eq('id', op.data.id);
          if (error) throw error;
          break;
        }
        case 'delete': {
          const { error } = await supabase
            .from(op.table)
            .delete()
            .eq('id', op.data.id);
          if (error) throw error;
          await offlineStorage.deleteCachedRecord(op.table, op.data.id);
          break;
        }
      }
      return true;
    } catch (error) {
      console.error('Sync operation failed:', error);
      return false;
    }
  };

  // Main sync function
  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || !user || syncInProgress.current) return;

    syncInProgress.current = true;
    setSyncState(prev => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      const operations = await offlineStorage.getPendingOperations();
      
      if (operations.length === 0) {
        setSyncState(prev => ({ 
          ...prev, 
          isSyncing: false,
          lastSyncedAt: new Date(),
        }));
        syncInProgress.current = false;
        return;
      }

      // Sort by timestamp to maintain order
      operations.sort((a, b) => a.timestamp - b.timestamp);

      let successCount = 0;
      let failCount = 0;

      for (const op of operations) {
        const success = await syncOperation(op);
        if (success) {
          await offlineStorage.markOperationSynced(op.id);
          successCount++;
        } else {
          failCount++;
        }
      }

      // Clean up synced operations
      await offlineStorage.clearSyncedOperations();
      await updatePendingCount();

      if (successCount > 0) {
        toast.success(`Synced ${successCount} offline change${successCount > 1 ? 's' : ''}`);
      }

      if (failCount > 0) {
        toast.error(`Failed to sync ${failCount} change${failCount > 1 ? 's' : ''}`);
        setSyncState(prev => ({ 
          ...prev, 
          syncError: `${failCount} operations failed to sync`,
        }));
      }

      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastSyncedAt: new Date(),
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncState(prev => ({ 
        ...prev, 
        isSyncing: false,
        syncError: 'Sync failed. Will retry when online.',
      }));
    } finally {
      syncInProgress.current = false;
    }
  }, [isOnline, user, updatePendingCount]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing changes...');
      // Delay sync slightly to ensure connection is stable
      setTimeout(() => {
        syncPendingOperations();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Changes will be saved locally.');
    };

    // Use both online/offline events and periodic connectivity checks
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check with retry
    const initialSync = async () => {
      await updatePendingCount();
      if (navigator.onLine) {
        // Small delay for initial page load
        setTimeout(() => {
          syncPendingOperations();
        }, 2000);
      }
    };
    initialSync();

    // Periodic connectivity check (handles edge cases where events don't fire)
    const connectivityCheck = setInterval(() => {
      const currentOnlineStatus = navigator.onLine;
      if (currentOnlineStatus !== isOnline) {
        if (currentOnlineStatus) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityCheck);
    };
  }, [syncPendingOperations, updatePendingCount, isOnline]);

  // Periodic sync when online
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      syncPendingOperations();
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, syncPendingOperations]);

  return {
    isOnline,
    ...syncState,
    syncNow: syncPendingOperations,
    updatePendingCount,
  };
}
