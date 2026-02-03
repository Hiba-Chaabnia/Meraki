/**
 * Small inline spinner — for buttons, rows and other tight spots.
 *
 * For a page-level or flow-level loading moment prefer `<FlowerSpinner />`,
 * which carries the brand mark. This one is the utility fallback.
 *
 * Track = full circle in the light ramp, fill = the spinning arc in the solid
 * color, so the ring stays visible on the cream background instead of
 * disappearing into it.
 */

const sizeClasses = {
  xs: "w-3.5 h-3.5 border-2",
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-[3px]",
} as const;

const variantClasses = {
  default: "border-[var(--primary-lighter)] border-t-[var(--primary)]",
  secondary: "border-[var(--secondary-lighter)] border-t-[var(--secondary)]",
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
      role="status"
      aria-label="Loading"
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
