import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FluidGridProps {
  children: ReactNode;
  className?: string;
  /** Number of columns on mobile (default: 1) */
  cols?: 1 | 2;
  /** Number of columns on tablet (default: 2) */
  mdCols?: 1 | 2 | 3;
  /** Number of columns on desktop (default: 3) */
  lgCols?: 1 | 2 | 3 | 4;
  /** Gap size between items */
  gap?: "sm" | "md" | "lg";
}

const gapClasses = {
  sm: "gap-2 sm:gap-3",
  md: "gap-3 sm:gap-4 lg:gap-6",
  lg: "gap-4 sm:gap-6 lg:gap-8",
};

// Static class mappings for Tailwind JIT compatibility
const mobileColClasses = {
  1: "grid-cols-1",
  2: "grid-cols-2",
};

const mdColClasses = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
};

const lgColClasses = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

export function FluidGrid({
  children,
  className,
  cols = 1,
  mdCols = 2,
  lgCols = 3,
  gap = "md",
}: FluidGridProps) {
  return (
    <div
      className={cn(
        "grid w-full",
        mobileColClasses[cols],
        mdColClasses[mdCols],
        lgColClasses[lgCols],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ContentContainerProps {
  children: ReactNode;
  className?: string;
  /** Max width on large screens (default: 1200px) */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-full",
};

export function ContentContainer({
  children,
  className,
  maxWidth = "xl",
}: ContentContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
