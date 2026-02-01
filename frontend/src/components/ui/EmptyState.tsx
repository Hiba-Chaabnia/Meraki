import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  /** Renders a dashed border box around the content — use for inline / card placement */
  bordered?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  bordered = false,
  className = "",
}: EmptyStateProps) {
  const content = (
    <div className={`text-center ${bordered ? "p-8" : ""} ${className}`}>
      {icon && <div className="mb-3">{icon}</div>}
      {title && <p className="text-gray-500 font-medium mb-1">{title}</p>}
      <p className="text-sm text-gray-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );

  if (bordered) {
    return (
      <div className="border-2 border-dashed border-gray-200 rounded-2xl">
        {content}
      </div>
    );
  }

  return content;
}
