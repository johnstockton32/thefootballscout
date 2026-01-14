import { cn } from '@/lib/utils';

interface AttributeBarProps {
  name: string;
  value: number | null;
  maxValue?: number;
  showValue?: boolean;
}

export function AttributeBar({ name, value, maxValue = 20, showValue = true }: AttributeBarProps) {
  const actualValue = value ?? 0;
  const percentage = (actualValue / maxValue) * 100;
  
  const getColorClass = () => {
    if (actualValue >= 17) return 'bg-primary';
    if (actualValue >= 14) return 'bg-amber-500';
    if (actualValue >= 11) return 'bg-muted-foreground';
    return 'bg-destructive';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-32 shrink-0">{name}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-500', getColorClass())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <span className="text-sm font-medium w-6 text-right">{value ?? '-'}</span>
      )}
    </div>
  );
}