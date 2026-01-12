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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <span className={cn('text-lg font-bold tabular-nums', getColor())}>
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={1}
        className="cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Poor ({min})</span>
        <span>World Class ({max})</span>
      </div>
    </div>
  );
}
