import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  variant?: 'player' | 'report' | 'stat' | 'default';
  className?: string;
}

export function SkeletonCard({ variant = 'default', className }: SkeletonCardProps) {
  if (variant === 'player') {
    return (
      <div className={cn('p-4 rounded-xl bg-card border border-border', className)}>
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 mt-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'report') {
    return (
      <div className={cn('p-3 rounded-lg bg-muted/50', className)}>
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-10 rounded-lg" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className={cn('p-4 rounded-xl bg-card border border-border', className)}>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  return (
    <div className={cn('p-4 rounded-xl bg-card border border-border space-y-3', className)}>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonList({ count = 3, variant = 'default' }: { count?: number; variant?: SkeletonCardProps['variant'] }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </>
  );
}
