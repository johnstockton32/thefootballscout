import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary' | 'gold';
}

export function StatCard({ title, value, subtitle, icon, trend, variant = 'default' }: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-status-success';
    if (trend.value < 0) return 'text-status-danger';
    return 'text-muted-foreground';
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-5 transition-all duration-200 cursor-pointer group bg-card border border-border relative overflow-hidden',
        'hover:shadow-md',
        variant === 'primary' && 'hover:border-primary/30',
        variant === 'gold' && 'hover:border-accent/30',
      )}
    >
      {/* Subtle accent line */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl',
        variant === 'default' && 'bg-border',
        variant === 'primary' && 'bg-primary',
        variant === 'gold' && 'bg-accent',
      )} />
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'p-2.5 rounded-xl',
            variant === 'default' && 'bg-secondary',
            variant === 'primary' && 'bg-primary/10',
            variant === 'gold' && 'bg-accent/10'
          )}
        >
          <span
            className={cn(
              variant === 'default' && 'text-muted-foreground',
              variant === 'primary' && 'text-primary',
              variant === 'gold' && 'text-accent'
            )}
          >
            {icon}
          </span>
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-secondary', getTrendColor())}>
            {getTrendIcon()}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs text-muted-foreground mt-2">{trend.label}</p>
        )}
      </div>
    </div>
  );
}
