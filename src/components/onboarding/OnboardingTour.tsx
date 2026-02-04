import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles, 
  Users, 
  FileText, 
  LayoutDashboard,
  Navigation,
  Crown,
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TourStep } from '@/hooks/useOnboardingTour';

interface OnboardingTourProps {
  isOpen: boolean;
  currentStep: number;
  totalSteps: number;
  currentTourStep: TourStep;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

const stepIcons: Record<string, React.ReactNode> = {
  welcome: <Sparkles className="w-8 h-8" />,
  dashboard: <LayoutDashboard className="w-8 h-8" />,
  'add-player': <Users className="w-8 h-8" />,
  'create-report': <FileText className="w-8 h-8" />,
  navigation: <Navigation className="w-8 h-8" />,
  subscription: <Crown className="w-8 h-8" />,
  complete: <Rocket className="w-8 h-8" />,
};

export function OnboardingTour({
  isOpen,
  currentStep,
  totalSteps,
  currentTourStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: OnboardingTourProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !currentTourStep.targetSelector) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const target = document.querySelector(currentTourStep.targetSelector!);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll element into view if needed
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, currentTourStep]);

  const getTooltipPosition = (): React.CSSProperties => {
    // Always center on mobile for better UX
    const isMobile = window.innerWidth < 640;
    
    if (!targetRect || currentTourStep.position === 'center' || isMobile) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = Math.min(380, window.innerWidth - 32);
    const tooltipHeight = 200;

    switch (currentTourStep.position) {
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.min(Math.max(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, padding), window.innerWidth - tooltipWidth - padding)}px`,
        };
      case 'top':
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${Math.min(Math.max(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, padding), window.innerWidth - tooltipWidth - padding)}px`,
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.left - tooltipWidth - padding}px`,
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.right + padding}px`,
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - solid color on mobile, no blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70"
            onClick={onSkip}
          />

          {/* Highlight target element - hidden on mobile */}
          {targetRect && currentTourStep.position !== 'center' && window.innerWidth >= 640 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[101] pointer-events-none hidden sm:block"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                borderRadius: '12px',
              }}
            >
              <div className="absolute inset-0 border-2 border-primary rounded-xl animate-pulse" />
            </motion.div>
          )}

          {/* Tooltip Card - Full width on mobile */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[102] w-[calc(100vw-32px)] sm:w-[380px] max-w-[400px]"
            style={getTooltipPosition()}
          >
            <Card className="border-primary/20 shadow-2xl overflow-hidden bg-card">
              {/* Progress Bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <CardContent className="p-4 sm:p-6">
                {/* Close Button */}
                <button
                  onClick={onSkip}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10 touch-manipulation"
                  aria-label="Close tour"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Icon & Step Counter */}
                <div className="flex items-center justify-between mb-3 sm:mb-4 pr-8">
                  <div className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0",
                    "bg-gradient-to-br from-primary/20 to-primary/5 text-primary"
                  )}>
                    <div className="w-6 h-6 sm:w-8 sm:h-8">
                      {stepIcons[currentTourStep.id] || <Sparkles className="w-full h-full" />}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {currentStep + 1} of {totalSteps}
                  </span>
                </div>

                {/* Content */}
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-lg sm:text-xl font-bold mb-2">{currentTourStep.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {currentTourStep.description}
                  </p>
                </motion.div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-border gap-3">
                  <div className="shrink-0">
                    {!isFirstStep && (
                      <Button 
                        variant="ghost" 
                        size="default" 
                        onClick={onPrev} 
                        className="touch-manipulation min-h-[44px] px-3"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isLastStep && (
                      <Button 
                        variant="ghost" 
                        size="default" 
                        onClick={onSkip} 
                        className="touch-manipulation min-h-[44px] px-3"
                      >
                        Skip
                      </Button>
                    )}
                    <Button 
                      variant="hero" 
                      size="default" 
                      onClick={isLastStep ? onComplete : onNext}
                      className="touch-manipulation min-h-[44px] px-4"
                    >
                      {isLastStep ? (
                        <>
                          Get Started
                          <Rocket className="w-4 h-4 ml-1.5" />
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-center gap-1.5 mt-4">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        i === currentStep ? "bg-primary" : "bg-muted"
                      )}
                      animate={i === currentStep ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}