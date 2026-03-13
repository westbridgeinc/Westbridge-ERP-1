"use client";

import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  /** Muted text below the action, e.g. "Need help? Contact support@..." */
  supportLine?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  supportLine,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="status">
      {icon && (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-muted-foreground/50"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-6">
          {actionHref ? (
            <a href={actionHref}>
              <Button variant="default" size="default">
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button variant="default" size="default" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
      {supportLine && <p className="mt-4 text-sm text-muted-foreground/60">{supportLine}</p>}
    </div>
  );
}
