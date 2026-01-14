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
        'rounded-xl p-5 transition-all duration-200 hover:scale-[1.03] cursor-pointer hover:shadow-lg',
        variant === 'default' && 'card-glass hover:border-primary/20',
        variant === 'primary' && 'card-glow hover:border-primary/40',
        variant === 'gold' && 'card-gold-glow hover:border-accent/40'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            'p-2.5 rounded-lg',
            variant === 'default' && 'bg-muted',
            variant === 'primary' && 'bg-primary/20',
            variant === 'gold' && 'bg-accent/20'
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
          <div className={cn('flex items-center gap-1 text-xs font-medium', getTrendColor())}>
            {getTrendIcon()}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold tabular-nums">{value}</p>
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
