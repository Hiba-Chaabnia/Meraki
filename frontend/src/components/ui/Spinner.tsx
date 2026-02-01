/**
 * Reusable spinner — replaces the 3 one-off animated divs scattered
 * across HobbyCard, AddHobbyModal, and ResultsLoading.
 */

const sizeClasses = {
  xs: "w-3.5 h-3.5 border-2",
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
} as const;

// track = full circle, fill = the spinning arc (border-t)
const variantClasses = {
  default: "border-[var(--lavender)] border-t-transparent",
  white: "border-white/30 border-t-white",
  subtle: "border-gray-300/40 border-t-gray-400",
} as const;

interface SpinnerProps {
  size?: keyof typeof sizeClasses;
  variant?: keyof typeof variantClasses;
  className?: string;
}

export function Spinner({
  size = "md",
  variant = "default",
  className = "",
}: SpinnerProps) {
  return (
    <div
      className={[
        "rounded-full animate-spin flex-shrink-0",
        sizeClasses[size],
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
