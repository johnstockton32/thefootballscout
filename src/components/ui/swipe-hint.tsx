import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeHintProps {
  show: boolean;
  direction?: "left" | "right" | "both";
  className?: string;
}

export function SwipeHint({ show, direction = "both", className }: SwipeHintProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={cn(
            "flex items-center justify-center gap-2 py-2 px-4",
            "text-xs text-muted-foreground",
            className
          )}
        >
          {(direction === "right" || direction === "both") && (
            <motion.div
              className="flex items-center gap-1"
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
            >
              <ChevronRight className="w-3 h-3" />
              <Pencil className="w-3 h-3" />
              <span>Edit</span>
            </motion.div>
          )}
          
          {direction === "both" && (
            <span className="text-border">•</span>
          )}
          
          {(direction === "left" || direction === "both") && (
            <motion.div
              className="flex items-center gap-1"
              animate={{ x: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
            >
              <span>Delete</span>
              <Trash2 className="w-3 h-3" />
              <ChevronLeft className="w-3 h-3" />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manage first-time swipe hint display
export function useSwipeHint(storageKey: string) {
  const [showHint, setShowHint] = React.useState(false);

  React.useEffect(() => {
    const hasSeenHint = localStorage.getItem(`swipe-hint-${storageKey}`);
    if (!hasSeenHint) {
      setShowHint(true);
      // Auto-hide after 5 seconds and mark as seen
      const timer = setTimeout(() => {
        setShowHint(false);
        localStorage.setItem(`swipe-hint-${storageKey}`, 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const dismissHint = React.useCallback(() => {
    setShowHint(false);
    localStorage.setItem(`swipe-hint-${storageKey}`, 'true');
  }, [storageKey]);

  return { showHint, dismissHint };
}
