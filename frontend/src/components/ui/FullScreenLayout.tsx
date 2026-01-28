"use client";

import Link from "next/link";
import { ArrowLeftIcon, HomeIcon } from "@/components/ui/Icons";

interface FullScreenLayoutProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  showDashboardLink?: boolean;
  scrollable?: boolean;
  /** Rendered between header and content, full width */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

export function FullScreenLayout({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  showDashboardLink,
  scrollable = false,
  toolbar,
  children,
}: FullScreenLayoutProps) {
  const hasNav = backHref || showDashboardLink;
  const showHeader = hasNav || title;

  return (
    <div
      className={`w-full bg-[var(--background)] flex flex-col ${scrollable ? "min-h-screen overflow-x-clip" : "h-screen overflow-hidden"
        }`}
    >
      {/* Header */}
      {showHeader && (
        <header className="flex-shrink-0 w-full px-4 pt-6 pb-2">
          {hasNav ? (
            title ? (
              <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
                {backHref ? (
                  <Link
                    href={backHref}
                    className="p-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
                    title={backLabel}
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </Link>
                ) : (
                  <div />
                )}

                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-semibold text-[var(--foreground)]">
                    {title}
                  </p>
                  {subtitle && (
                    <p className="text-md md:text-lg font-medium text-[var(--foreground)] mt-2">
                      {subtitle}
                    </p>
                  )}
                </div>

                {showDashboardLink ? (
                  <Link
                    href="/dashboard"
                    className="p-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
                    title="Dashboard"
                  >
                    <HomeIcon className="w-5 h-5" />
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {backHref ? (
                  <Link
                    href={backHref}
                    className="p-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
                    title={backLabel}
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </Link>
                ) : (
                  <div />
                )}
                {showDashboardLink ? (
                  <Link
                    href="/dashboard"
                    className="p-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
                    title="Dashboard"
                  >
                    <HomeIcon className="w-5 h-5" />
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            )
          ) : (
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-semibold text-[var(--foreground)]">
                {title}
              </p>
              {subtitle && (
                <p className="text-md md:text-lg font-medium text-[var(--foreground)] mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </header>
      )}

      {/* Toolbar */}
      {toolbar && <div className="flex-shrink-0">{toolbar}</div>}

      {/* Content */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
