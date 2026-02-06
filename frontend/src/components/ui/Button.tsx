import { forwardRef } from "react";
import Link from "next/link";

/* ── Variant × Size × Shape token maps ── */

const variantStyles = {
  primary:
    "bg-[var(--primary)] text-white hover:scale-105 active:scale-95",
  secondary:
    "bg-[var(--secondary)] text-[var(--foreground)] hover:scale-105 active:scale-95",
  ghost:
    "bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95",
  destructive:
    "bg-red-500 text-white hover:bg-red-600 active:scale-95",
  "destructive-soft":
    "bg-red-50 text-red-600 hover:bg-red-100 active:scale-95",
  outline:
    "bg-transparent border border-[var(--btn-ol)] text-[var(--btn-ol)] hover:border-[var(--btn-ol-hover)] hover:text-[var(--btn-ol-hover)] active:scale-95",
  link: "bg-transparent text-[var(--secondary)] hover:underline p-0",
} as const;

const variantStylesNoScale = {
  primary:
    "bg-[var(--primary)] text-white",
  secondary:
    "bg-[var(--secondary)] text-[var(--foreground)]",
  ghost:
    "bg-gray-100 text-gray-600 hover:bg-gray-200",
  destructive:
    "bg-red-500 text-white hover:bg-red-600",
  "destructive-soft":
    "bg-red-50 text-red-600 hover:bg-red-100",
  outline:
    "bg-transparent border border-[var(--btn-ol)] text-[var(--btn-ol)] hover:border-[var(--btn-ol-hover)] hover:text-[var(--btn-ol-hover)]",
  link: "bg-transparent text-[var(--secondary)] hover:underline p-0",
} as const;

const sizeStyles = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-3 text-lg",
} as const;

const shapeStyles = {
  default: "rounded-xl",
  pill: "rounded-full",
} as const;

const iconOnlySizeStyles = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-3",
} as const;

/* ── Types ── */

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;
export type ButtonShape = keyof typeof shapeStyles;

interface SharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
  iconOnly?: boolean;
  /** Outline variant — border & text color (default: #e5e7eb / gray-200) */
  outlineColor?: string;
  /** Outline variant — border & text color on hover (default: darkened outlineColor) */
  outlineHoverColor?: string;
  /** Disable scale animation on hover. Default: false */
  noScaleOnHover?: boolean;
}

export type ButtonProps = SharedProps &
  (
    | ({ href: string } & Omit<
        React.AnchorHTMLAttributes<HTMLAnchorElement>,
        "href"
      >)
    | ({ href?: never } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  );

/* ── Shared class builder ── */

function buildClasses(
  {
    variant = "primary",
    size = "md",
    shape = "default",
    fullWidth = false,
    iconOnly = false,
    noScaleOnHover = false,
  }: SharedProps,
  disabled: boolean | undefined,
  className: string
) {
  const base =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer";
  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed pointer-events-none"
    : "";
  const widthStyle = fullWidth ? "w-full" : "";

  const isLink = variant === "link";
  const padding = isLink
    ? ""
    : iconOnly
      ? iconOnlySizeStyles[size]
      : sizeStyles[size];
  const radius = isLink ? "" : shapeStyles[shape];

  // Use variant styles without scale if noScaleOnHover is true
  const variantStyle = noScaleOnHover ? variantStylesNoScale[variant] : variantStyles[variant];

  return [
    base,
    variantStyle,
    padding,
    radius,
    widthStyle,
    disabledStyles,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildOutlineVars(
  variant: ButtonVariant | undefined,
  outlineColor: string | undefined,
  outlineHoverColor: string | undefined
): React.CSSProperties {
  if (variant !== "outline") return {};
  return {
    "--btn-ol": outlineColor ?? "#e5e7eb",
    "--btn-ol-hover": outlineHoverColor ?? outlineColor ?? "#d1d5db",
  } as React.CSSProperties;
}

/* ── Component ── */

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>((props, ref) => {
  const {
    variant = "primary",
    size = "md",
    shape = "default",
    fullWidth = false,
    iconOnly = false,
    outlineColor,
    outlineHoverColor,
    noScaleOnHover = false,
    className = "",
    style,
    children,
    ...rest
  } = props;

  const sharedProps: SharedProps = {
    variant,
    size,
    shape,
    fullWidth,
    iconOnly,
    noScaleOnHover,
  };

  const classes = buildClasses(
    sharedProps,
    "disabled" in rest ? (rest as { disabled?: boolean }).disabled : false,
    className
  );
  const cssVars = buildOutlineVars(variant, outlineColor, outlineHoverColor);
  const mergedStyle = { ...cssVars, ...style };

  if ("href" in props && props.href) {
    // Spread from `rest`, never from `props`: `props` still carries className,
    // style and children, and spreading those would overwrite the computed
    // variant classes with the caller's className instead of appending to it.
    const { href: _href, ...anchorProps } = rest as {
      href?: string;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>;

    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={props.href}
        className={classes}
        style={mergedStyle}
        {...anchorProps}
      >
        {children}
      </Link>
    );
  }

  const {
    variant: _v,
    size: _s,
    shape: _sh,
    fullWidth: _fw,
    iconOnly: _io,
    outlineColor: _oc,
    outlineHoverColor: _ohc,
    noScaleOnHover: _nsh,
    ...buttonProps
  } = rest as React.ButtonHTMLAttributes<HTMLButtonElement> &
    Record<string, unknown>;

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classes}
      style={mergedStyle}
      {...(buttonProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
