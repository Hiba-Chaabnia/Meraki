import React from "react";

const variantClasses = {
  default: "bg-white border border-gray-100 shadow-sm",
  elevated: "bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow",
  bordered: "bg-white border-2 shadow-sm",
} as const;

const radiusClasses = {
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
} as const;

const paddingClasses = {
  md: "p-5",
  lg: "p-6",
  none: "",
} as const;

interface CardProps {
  children: React.ReactNode;
  variant?: keyof typeof variantClasses;
  radius?: keyof typeof radiusClasses;
  padding?: keyof typeof paddingClasses;
  /** CSS color value for the border — only applies when variant="bordered" */
  borderColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({
  children,
  variant = "default",
  radius = "2xl",
  padding = "lg",
  borderColor,
  className = "",
  style,
}: CardProps) {
  const mergedStyle: React.CSSProperties = {
    ...(variant === "bordered" && borderColor ? { borderColor } : {}),
    ...style,
  };

  return (
    <div
      className={[
        variantClasses[variant],
        radiusClasses[radius],
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={Object.keys(mergedStyle).length ? mergedStyle : undefined}
    >
      {children}
    </div>
  );
}
