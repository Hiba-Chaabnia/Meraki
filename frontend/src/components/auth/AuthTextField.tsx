import React from "react";

interface AuthTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Rendered in the left gutter, sized by this component. */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  "aria-label": string;
}

/** Icon-prefixed input — the name/email fields on login and signup. */
export function AuthTextField({ icon: Icon, ...props }: AuthTextFieldProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <Icon className="w-5 h-5" />
      </span>
      <input
        {...props}
        className="w-full p-3 pl-11 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]/40 focus:border-[var(--secondary)] transition-colors"
      />
    </div>
  );
}
