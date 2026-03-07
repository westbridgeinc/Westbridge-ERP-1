"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className = "", disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? `checkbox-${generatedId.replace(/:/g, "")}`;
    return (
      <label
        htmlFor={inputId}
        className={`inline-flex cursor-pointer items-center gap-3 ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      >
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary shadow-sm transition-all duration-150 peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
        >
          <svg
            className="h-2.5 w-2.5 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity"
            style={{ opacity: "var(--tw-peer-checked, 0)" }}
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2.5 6 5 8.5 9.5 3.5" />
          </svg>
        </span>
        <span className="text-[0.9375rem] text-foreground">
          {label}
        </span>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
