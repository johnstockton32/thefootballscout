import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOfflineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

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
