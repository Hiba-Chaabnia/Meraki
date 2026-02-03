import type { ElementType, ReactNode } from "react";

/**
 * The flow's terminal-failure block: heading, one plain sentence, then actions.
 *
 * Terminal failures — where the page has nothing left to show — deliberately
 * use no red. Red is reserved for incidental problems, where the page still
 * works and one thing degraded (see the sampling strip and the watch toast).
 *
 * Renders the inner block only; the page owns its own full-height wrapper.
 */
interface ErrorStateProps {
  /** Defaults to the flow's standard heading. */
  title?: string;
  /** One sentence: what failed, and anything the user needs to know. */
  message: ReactNode;
  /** Buttons — usually a `secondary` retry plus a `ghost` escape hatch. */
  actions?: ReactNode;
  /**
   * Heading element. `h1` for a page-level boundary; drop to `h2`/`h3` when
   * nested inside something that already has a heading.
   */
  as?: ElementType;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  actions,
  as: Heading = "h1",
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`max-w-md w-full text-center ${className}`}>
      <Heading className="page-title mb-2">{title}</Heading>
      <p className="text-gray-500 text-sm mb-6">{message}</p>
      {actions && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
