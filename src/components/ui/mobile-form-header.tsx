import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileFormHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  progress?: {
    current: number;
    total: number;
  };
  sticky?: boolean;
  className?: string;
}

export function MobileFormHeader({
  title,
  subtitle,
  onBack,
  rightContent,
  progress,
  sticky = true,
  className,
}: MobileFormHeaderProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Progress percentage
  const progressPercent = progress ? (progress.current / progress.total) * 100 : 0;

  return (
    <div
      className={cn(
        isMobile && sticky && "sticky-header-mobile",
        !isMobile && "mb-4 sm:mb-6",
        className
      )}
    >
      {/* Progress bar */}
      {progress && isMobile && (
        <div className="h-1 bg-muted -mx-3 mb-3">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0 -ml-2 h-9 w-9"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold truncate">
              {title}
            </h1>
            {subtitle && !isMobile && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {rightContent && (
          <div className="flex items-center gap-2 shrink-0">
            {rightContent}
          </div>
        )}
      </div>

      {/* Progress text - mobile only */}
      {progress && isMobile && (
        <p className="text-xs text-muted-foreground mt-2">
          Step {progress.current} of {progress.total}
        </p>
      )}
    </div>
  );
}
