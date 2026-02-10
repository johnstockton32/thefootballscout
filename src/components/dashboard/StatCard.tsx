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
        'rounded-2xl p-5 transition-all duration-300 cursor-pointer group relative overflow-hidden',
        variant === 'default' && 'card-glass hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg',
        variant === 'primary' && 'card-glow hover:border-primary/50 hover:-translate-y-1',
        variant === 'gold' && 'card-gold-glow hover:border-accent/50 hover:-translate-y-1'
      )}
    >
      {/* Shimmer overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-foreground/[0.02] to-transparent" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
              variant === 'default' && 'bg-muted',
              variant === 'primary' && 'bg-primary/15',
              variant === 'gold' && 'bg-accent/15'
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
            <div className={cn('flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-muted/50', getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1 font-medium">{title}</p>
          <p className="text-4xl font-bold tabular-nums font-heading tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
          )}
          {trend && (
            <p className="text-xs text-muted-foreground mt-2">{trend.label}</p>
          )}
        </div>
      </div>
    </div>
  );
}
