import * as React from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
}

export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions,
  cancelLabel = "Cancel",
}: ActionSheetProps) {
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onOpenChange(false);
    }
  };

  const handleActionClick = (action: ActionSheetAction) => {
    if (action.disabled) return;
    action.onClick();
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50",
              "bg-card rounded-t-2xl",
              "safe-area-bottom"
            )}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="px-4 pb-4 text-center border-b border-border">
                {title && (
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="p-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl",
                    "touch-target transition-colors",
                    action.disabled && "opacity-50 cursor-not-allowed",
                    action.variant === "destructive"
                      ? "text-destructive hover:bg-destructive/10 active:bg-destructive/20"
                      : "text-foreground hover:bg-muted active:bg-muted/80"
                  )}
                >
                  {action.icon && (
                    <span className="w-5 h-5 flex items-center justify-center">
                      {action.icon}
                    </span>
                  )}
                  <span className="font-medium">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Cancel Button */}
            <div className="p-2 pt-0">
              <button
                onClick={() => onOpenChange(false)}
                className={cn(
                  "w-full py-3.5 rounded-xl",
                  "bg-muted text-foreground font-semibold",
                  "touch-target transition-colors",
                  "hover:bg-muted/80 active:bg-muted/60"
                )}
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
