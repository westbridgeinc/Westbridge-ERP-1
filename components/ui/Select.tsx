"use client";

import { forwardRef, useId, type SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, id, className = "", ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? `select-${generatedId.replace(/:/g, "")}`;
    return (
      <div className="w-full">
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          className={[
            "h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 pr-9 text-sm shadow-sm text-foreground transition-[border-color,box-shadow] duration-150",
            "focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0",
            error
              ? "border-destructive focus:border-destructive"
              : "focus:border-primary",
            className,
          ].filter(Boolean).join(" ")}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23737373' d='M6 8.825c-.2 0-.4-.075-.55-.225l-3-3a.776.776 0 0 1 0-1.1.776.776 0 0 1 1.1 0L6 6.95 8.45 4.5a.776.776 0 0 1 1.1 0 .776.776 0 0 1 0 1.1l-3 3c-.15.15-.35.225-.55.225Z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-sm text-muted-foreground/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
