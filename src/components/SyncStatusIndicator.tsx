import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SyncStatusIndicator() {
  const { 
    isOnline, 
    isSyncing, 
    pendingCount, 
    lastSyncedAt, 
    syncError,
    syncNow 
  } = useOfflineSync();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              <span className="hidden sm:inline">Synced</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>All changes synced</p>
            {lastSyncedAt && (
              <p className="text-xs text-muted-foreground">
                Last sync: {formatDistanceToNow(lastSyncedAt, { addSuffix: true })}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!isOnline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
                <CloudOff className="w-3 h-3" />
                <span>Offline</span>
                {pendingCount > 0 && (
                  <span className="ml-1 bg-amber-500/20 px-1.5 rounded-full text-[10px]">
                    {pendingCount}
                  </span>
                )}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You're offline</p>
            {pendingCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {pendingCount} change{pendingCount > 1 ? 's' : ''} pending sync
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Syncing...</span>
        </Badge>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={syncNow}
              className="h-7 gap-1.5 text-xs"
            >
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1">
                <Cloud className="w-3 h-3" />
                <span>{pendingCount} pending</span>
              </Badge>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to sync {pendingCount} pending change{pendingCount > 1 ? 's' : ''}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (syncError) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={syncNow}
              className="h-7 gap-1.5 text-xs"
            >
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Sync error</span>
              </Badge>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{syncError}</p>
            <p className="text-xs text-muted-foreground">Click to retry</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
