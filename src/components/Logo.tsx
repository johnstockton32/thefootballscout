import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.png";
interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}
export const Logo = forwardRef<HTMLDivElement, LogoProps>(({ size = "md", showText = false, className }, ref) => {
  // The new circular logo contains the text, so we primarily use the image
  const iconSizes = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };
  return (
    <div ref={ref} className={cn("flex items-center gap-3 mt-[3px]", className)}>
      <img
        alt="The Football Scout"
        className={cn("object-contain rounded-full", iconSizes[size])}
        src="/lovable-uploads/5a101acd-d7bc-4080-95eb-fc7b6e85f5ca.png"
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-display text-gradient-pitch text-xl")}>THE FOOTBALL</span>
          <span className={cn("font-display text-foreground tracking-widest text-xl")}>SCOUT</span>
        </div>
      )}
    </div>
  );
});
Logo.displayName = "Logo";
