import { forwardRef } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationToggle = forwardRef<HTMLDivElement>(function NotificationToggle(_props, ref) {
  const { isSupported, isSubscribed, isLoading, toggleSubscription, permission } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSubscription}
            disabled={isLoading}
            className="h-9 w-9"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isLoading 
              ? 'Loading...' 
              : permission === 'denied' 
                ? 'Notifications blocked in browser'
                : isSubscribed 
                  ? 'Disable notifications' 
                  : 'Enable notifications'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
