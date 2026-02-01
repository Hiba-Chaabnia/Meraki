import { forwardRef } from "react";

const inputClasses =
  "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--secondary)] focus:border-[var(--secondary)] transition-colors";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  labelSuffix?: React.ReactNode;
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
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
        <input
          ref={ref}
          className={[inputClasses, error ? "border-red-400 focus:ring-red-400 focus:border-red-400" : "", className]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
