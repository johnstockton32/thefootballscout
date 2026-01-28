import { useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';

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
  const [isActive, setIsActive] = useState(false);
  const percentage = ((value - min) / (max - min)) * 100;

  const getColor = () => {
    if (percentage >= 75) return 'text-status-success';
    if (percentage >= 50) return 'text-primary';
    if (percentage >= 25) return 'text-rating';
    return 'text-status-warning';
  };

  const getBgColor = () => {
    if (percentage >= 75) return 'bg-status-success';
    if (percentage >= 50) return 'bg-primary';
    if (percentage >= 25) return 'bg-rating';
    return 'bg-status-warning';
  };

  const increment = useCallback(() => {
    if (value < max) onChange(value + 1);
  }, [value, max, onChange]);

  const decrement = useCallback(() => {
    if (value > min) onChange(value - 1);
  }, [value, min, onChange]);

  return (
    <div 
      className={cn(
        "space-y-2 sm:space-y-3 py-2 px-3 -mx-3 rounded-lg transition-colors",
        isActive && "bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Label className="text-xs sm:text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
          )}
        </div>
        
        {/* Mobile-friendly value display with +/- buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={decrement}
            disabled={value <= min}
            className={cn(
              "w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center",
              "bg-muted text-muted-foreground touch-target",
              "hover:bg-muted/80 active:scale-95 transition-all",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              "sm:hidden" // Hide on desktop
            )}
            aria-label="Decrease value"
          >
            <Minus className="w-3 h-3" />
          </button>
          
          <span className={cn(
            'text-lg sm:text-lg font-bold tabular-nums w-8 text-center shrink-0',
            getColor()
          )}>
            {value}
          </span>
          
          <button
            type="button"
            onClick={increment}
            disabled={value >= max}
            className={cn(
              "w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center",
              "bg-muted text-muted-foreground touch-target",
              "hover:bg-muted/80 active:scale-95 transition-all",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              "sm:hidden" // Hide on desktop
            )}
            aria-label="Increase value"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Slider with improved touch handling */}
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        onPointerDown={() => setIsActive(true)}
        onPointerUp={() => setIsActive(false)}
        min={min}
        max={max}
        step={1}
        className="cursor-pointer touch-pan-x"
      />
      
      {/* Value labels */}
      <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
        <span>Poor ({min})</span>
        <span>World Class ({max})</span>
      </div>
    </div>
  );
}
