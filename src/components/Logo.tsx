import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
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
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('relative', iconSizes[size])}>
        {/* Football icon with gradient */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(158 64% 45%)" />
              <stop offset="100%" stopColor="hsl(158 70% 30%)" />
            </linearGradient>
          </defs>
          {/* Outer circle */}
          <circle cx="50" cy="50" r="45" stroke="url(#logoGradient)" strokeWidth="4" fill="none" />
          {/* Pentagon pattern */}
          <path
            d="M50 15 L72 35 L65 62 L35 62 L28 35 Z"
            fill="url(#logoGradient)"
            opacity="0.3"
          />
          <path
            d="M50 15 L72 35 L65 62 L35 62 L28 35 Z"
            stroke="url(#logoGradient)"
            strokeWidth="2"
            fill="none"
          />
          {/* Scout eye/radar */}
          <circle cx="50" cy="42" r="12" stroke="url(#logoGradient)" strokeWidth="2" fill="none" />
          <circle cx="50" cy="42" r="4" fill="url(#logoGradient)" />
          {/* Crosshair lines */}
          <line x1="50" y1="28" x2="50" y2="36" stroke="url(#logoGradient)" strokeWidth="2" />
          <line x1="50" y1="48" x2="50" y2="56" stroke="url(#logoGradient)" strokeWidth="2" />
          <line x1="36" y1="42" x2="44" y2="42" stroke="url(#logoGradient)" strokeWidth="2" />
          <line x1="56" y1="42" x2="64" y2="42" stroke="url(#logoGradient)" strokeWidth="2" />
        </svg>
      </div>
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
