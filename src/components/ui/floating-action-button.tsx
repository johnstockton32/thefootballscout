import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FloatingAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "destructive";
}

interface FloatingActionButtonProps {
  actions: FloatingAction[];
  className?: string;
}

export function FloatingActionButton({ actions, className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useIsMobile();

  // Only show on mobile
  if (!isMobile) return null;

  const handleActionClick = (action: FloatingAction) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className={cn(
        "fixed right-4 z-50 flex flex-col-reverse items-end gap-3",
        "bottom-20 safe-area-bottom",
        className
      )}>
        {/* Action Buttons */}
        <AnimatePresence>
          {isOpen && actions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                transition: { delay: index * 0.05 }
              }}
              exit={{ opacity: 0, scale: 0.3, y: 20 }}
              onClick={() => handleActionClick(action)}
              className={cn(
                "flex items-center gap-3 pl-4 pr-5 py-3 rounded-full shadow-lg",
                "touch-target ios-active",
                action.variant === "primary" 
                  ? "bg-primary text-primary-foreground"
                  : action.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-card text-card-foreground border border-border"
              )}
            >
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
              {action.icon}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-lg flex items-center justify-center",
            "bg-primary text-primary-foreground",
            "touch-target-lg ios-active",
            isOpen && "bg-muted text-muted-foreground"
          )}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.button>
      </div>
    </>
  );
}
