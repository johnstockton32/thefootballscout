import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  shouldTrigger: boolean;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  shouldTrigger,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const displayDistance = isRefreshing ? 60 : pullDistance;

  return (
    <motion.div
      className="fixed top-14 left-0 right-0 z-40 flex items-center justify-center pointer-events-none"
      style={{ y: displayDistance - 40 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: pullDistance > 10 || isRefreshing ? 1 : 0 }}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg',
          shouldTrigger || isRefreshing
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-muted-foreground border border-border'
        )}
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : { rotate: (pullDistance / 80) * 180 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0 }}
        >
          <RefreshCw className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}
