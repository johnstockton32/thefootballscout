import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AttributeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  description?: string;
}

export function AttributeSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 20,
  description,
}: AttributeSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const getColor = () => {
    if (percentage >= 75) return 'text-status-success';
    if (percentage >= 50) return 'text-primary';
    if (percentage >= 25) return 'text-rating';
    return 'text-status-warning';
  };

  return (
    <div className="space-y-2 sm:space-y-3 py-1">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Label className="text-xs sm:text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
          )}
        </div>
        <span className={cn('text-base sm:text-lg font-bold tabular-nums shrink-0', getColor())}>
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={1}
        className="cursor-pointer touch-pan-x"
      />
      <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
        <span>Poor ({min})</span>
        <span>World Class ({max})</span>
      </div>
    </div>
  );
}
