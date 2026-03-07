"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id: idProp, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = idProp ?? generatedId;
    const input = (
      <input
        id={inputId}
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive",
          className
        )}
        ref={ref}
        aria-invalid={!!error}
        {...props}
      />
    );
    if (label != null || error != null) {
      return (
        <div className="w-full space-y-2">
          {label != null && (
            <Label htmlFor={inputId}>
              {label}
            </Label>
          )}
          {input}
          {error != null && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
        </div>
      );
    }
    return input;
  }
);
Input.displayName = "Input";

export { Input };
