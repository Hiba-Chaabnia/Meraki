"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon, HomeIcon } from "@/components/ui/Icons";

interface PageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  showHomeButton?: boolean;
  className?: string;
}

export function PageLayout({
  title,
  subtitle,
  children,
  showBackButton = true,
  backHref,
  backLabel = "Back",
  showHomeButton = true,
  className = "",
}: PageLayoutProps) {
  return (
    <div className={`h-screen w-screen bg-[var(--background)] overflow-y-auto ${className}`}>
      {/* ── Header Row ── */}
      <div className="w-full mx-auto px-4 pt-8 mb-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-top gap-4">
          {/* Back Button */}
          {showBackButton && backHref && (
            <Link
              href={backHref}
              className="p-2 -ml-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
              title={backLabel}
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </Link>
          )}

          {/* Center Content */}
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-semibold text-[var(--foreground)]">
              {title}
            </p>
            <p className="text-md md:text-lg font-medium text-[var(--foreground)] mt-2">
              {subtitle}
            </p>
          </div>

          {/* Home Button */}
          {showHomeButton && (
            <Link
              href="/dashboard"
              className="p-2 -mr-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
              title="Dashboard"
            >
              <HomeIcon className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="w-full mx-auto px-4">
        {children}
      </div>
    </div>
  );
}
