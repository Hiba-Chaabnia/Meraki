"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface NavItemConfig {
  href: string;
  label: string;
  mobileLabel?: string;
  Icon: LucideIcon;
}

interface NavItemProps {
  item: NavItemConfig;
  active: boolean;
  /** Icon-only mode — used when desktop sidebar is collapsed */
  collapsed?: boolean;
  /** Mobile drawer mode — uses mobileLabel and calls onNavigate on click */
  mobile?: boolean;
  onNavigate?: () => void;
}

const iconSpring = { type: "spring" as const, stiffness: 400, damping: 20 };

export function NavItem({ item, active, collapsed = false, mobile = false, onNavigate }: NavItemProps) {
  const displayLabel = mobile && item.mobileLabel ? item.mobileLabel : item.label;
  const activeClass = active
    ? "text-[var(--primary)]"
    : "text-gray-500 hover:text-[var(--secondary)]";

  if (collapsed) {
    return (
      <Link
        href={item.href}
        title={item.label}
        className={`flex items-center justify-center w-full h-10 rounded-xl transition-colors duration-200 ${activeClass}`}
      >
        <motion.div animate={{ scale: active ? 1.15 : 1 }} transition={iconSpring}>
          <item.Icon className="w-5 h-5 flex-shrink-0" />
        </motion.div>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${activeClass}`}
    >
      <motion.div
        animate={{ scale: active ? 1.15 : 1 }}
        transition={iconSpring}
        className="flex-shrink-0"
      >
        <item.Icon className="w-5 h-5" />
      </motion.div>
      <span className="whitespace-nowrap truncate">{displayLabel}</span>
    </Link>
  );
}
