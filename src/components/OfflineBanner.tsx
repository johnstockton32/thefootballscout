import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useAuth } from '@/contexts/AuthContext';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOfflineStatus();
  const { isOfflineMode, syncOfflineSession } = useAuth();
  const [showReconnected, setShowReconnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && isOfflineMode) {
      handleSync();
    }
  }, [isOnline, isOfflineMode]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineSession();
    } finally {
      setIsSyncing(false);
    }
  };

  // Show offline mode indicator
  if (isOfflineMode && !isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] py-2 px-4 text-center text-sm font-medium bg-amber-500 text-black">
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Offline Mode - Your session will sync when you reconnect
        </div>
      </div>
    );
  }

  // Show syncing indicator
  if (isOfflineMode && isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] py-2 px-4 text-center text-sm font-medium bg-blue-500 text-white">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          {isSyncing ? 'Syncing your session...' : 'Click to sync your offline session'}
          {!isSyncing && (
            <button 
              onClick={handleSync}
              className="underline hover:no-underline ml-2"
            >
              Sync Now
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] py-2 px-4 text-center text-sm font-medium transition-all duration-300',
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-amber-500 text-black'
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            Back online - syncing your data
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            You're offline - some features may be limited
          </>
        )}
      </div>
    </div>
  );
}
