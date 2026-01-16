import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ size = 'md', showText = true, className }, ref) => {
    const iconSizes = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
    };

    const textSizes = {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-3xl',
    };

    return (
      <div ref={ref} className={cn('flex items-center gap-3', className)}>
        <img 
          src={logoImage} 
          alt="The Football Scout" 
          className={cn('object-contain', iconSizes[size])}
        />
        {showText && (
          <div className="flex flex-col leading-none">
            <span className={cn('font-display text-gradient-pitch', textSizes[size])}>
              THE FOOTBALL
            </span>
            <span className={cn('font-display text-foreground tracking-widest', textSizes[size])}>
              SCOUT
            </span>
          </div>
        )}
      </div>
    );
  }
);

Logo.displayName = 'Logo';
