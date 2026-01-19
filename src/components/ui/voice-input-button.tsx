import { Mic, MicOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onClick: () => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function VoiceInputButton({
  isListening,
  isSupported,
  onClick,
  className,
  size = 'icon',
}: VoiceInputButtonProps) {
  const { limits } = useSubscription();
  
  if (!isSupported) {
    return null;
  }

  // Show locked state for free users
  if (!limits.hasVoiceToText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size={size}
              disabled
              className={cn('opacity-50 cursor-not-allowed', className)}
            >
              <Lock className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice input requires Pro or Team plan</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={isListening ? 'destructive' : 'outline'}
            size={size}
            onClick={onClick}
            className={cn(
              'relative transition-all',
              isListening && 'animate-pulse ring-2 ring-destructive ring-offset-2 ring-offset-background',
              className
            )}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                </span>
              </>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isListening ? 'Stop recording' : 'Start voice input'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
