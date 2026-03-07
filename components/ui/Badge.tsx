import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        warning: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        error: "border-transparent bg-destructive text-destructive-foreground shadow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
  Paid: "success",
  Active: "success",
  Submitted: "default",
  Draft: "outline",
  Overdue: "destructive",
  Unpaid: "secondary",
  Error: "destructive",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional: map status string to variant (e.g. Paid -> success, Draft -> outline) */
  status?: string;
}

function Badge({ className, variant, status, ...props }: BadgeProps) {
  const resolvedVariant = variant ?? (status ? (STATUS_VARIANT[status] ?? "secondary") : undefined);
  return <div className={cn(badgeVariants({ variant: resolvedVariant }), className)} {...props} />;
}

export { Badge, badgeVariants };
