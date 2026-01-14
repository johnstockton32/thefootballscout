import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
}

const calculateStrength = (password: string): StrengthResult => {
  if (!password) {
    return { score: 0, label: "", color: "" };
  }

  let score = 0;
  
  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  // Normalize to 0-4 scale
  const normalizedScore = Math.min(4, Math.floor(score / 1.75));
  
  const levels: StrengthResult[] = [
    { score: 0, label: "Too weak", color: "bg-destructive" },
    { score: 1, label: "Weak", color: "bg-orange-500" },
    { score: 2, label: "Fair", color: "bg-yellow-500" },
    { score: 3, label: "Good", color: "bg-lime-500" },
    { score: 4, label: "Strong", color: "bg-green-500" },
  ];
  
  return levels[normalizedScore];
};

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);
  
  if (!password) return null;
  
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200",
              level <= strength.score ? strength.color : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className={cn(
        "text-xs transition-colors",
        strength.score <= 1 ? "text-destructive" : 
        strength.score === 2 ? "text-yellow-600" : 
        "text-muted-foreground"
      )}>
        {strength.label}
      </p>
    </div>
  );
}
