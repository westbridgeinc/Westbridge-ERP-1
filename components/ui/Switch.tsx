"use client";

import { forwardRef } from "react";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, disabled = false, id, className = "", ...aria }, ref) => {
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-primary" : "bg-input"} ${className}`}
        {...aria}
      >
        <span
          className="pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform duration-200"
          style={{
            transform: checked ? "translateX(18px)" : "translateX(2px)",
            marginTop: "2px",
          }}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";
