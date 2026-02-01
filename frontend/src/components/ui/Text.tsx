import React from "react";

/* Maps semantic variant names to the CSS utility classes defined in globals.css */
const variants = {
  display:      "display-heading",
  "page-title": "page-title",
  "card-heading":"card-heading",
  label:        "label",
  "label-sm":   "label-sm",
  "body-sm":    "body-sm",
  caption:      "caption",
  "back-link":  "back-link",
} as const;

export type TextVariant = keyof typeof variants;
type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div" | "label";

interface TextProps {
  variant: TextVariant;
  as?: Tag;
  className?: string;
  children: React.ReactNode;
}

export function Text({ variant, as: Tag = "p", className, children }: TextProps) {
  const cls = [variants[variant], className].filter(Boolean).join(" ");
  return <Tag className={cls}>{children}</Tag>;
}
