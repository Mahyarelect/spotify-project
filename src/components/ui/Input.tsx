import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, endAdornment, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? (typeof props.name === "string" ? props.name : generatedId);
    const errorId = `${inputId}-error`;
    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-100 ${
              error
                ? "border-red-500 bg-red-50/60 focus:ring-red-500 dark:border-red-500 dark:bg-red-950/20"
                : "border-zinc-300 focus:ring-green-500 dark:border-zinc-600"
            } ${className}`}
            {...props}
          />
          {endAdornment}
        </div>
        <p
          id={errorId}
          aria-live="polite"
          className={`min-h-5 text-sm text-red-500 ${error ? "" : "invisible"}`}
        >
          {error ?? "\u00a0"}
        </p>
      </div>
    );
  }
);

Input.displayName = "Input";
