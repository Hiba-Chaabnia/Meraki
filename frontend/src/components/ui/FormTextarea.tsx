import { forwardRef } from "react";

const textareaClasses =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--secondary)] focus:border-[var(--secondary)] resize-none transition-colors";

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  error?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, labelSuffix, error, className = "", ...rest }, ref) => {
    return (
      <div>
        {label && (
          <label className="text-sm font-medium text-gray-600 mb-1.5 block">
            {label}
            {labelSuffix && (
              <span className="text-gray-400 font-normal ml-1">{labelSuffix}</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          className={[textareaClasses, error ? "border-red-400 focus:ring-red-400 focus:border-red-400" : "", className]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";
