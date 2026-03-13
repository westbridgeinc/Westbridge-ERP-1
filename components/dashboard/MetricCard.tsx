import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  subtextVariant?: "default" | "success" | "error" | "muted";
  icon?: React.ComponentType<{ className?: string }>;
  trend?: number;
}

export function MetricCard({ label, value, subtext, subtextVariant = "muted", icon: Icon, trend }: MetricCardProps) {
  const subtextClass =
    subtextVariant === "success"
      ? "text-success"
      : subtextVariant === "error"
        ? "text-destructive"
        : "text-muted-foreground";

  const TrendIcon = trend != null ? (trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus) : null;

  const trendClass =
    trend != null ? (trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : "text-muted-foreground") : "";

  return (
    <Card className="hover:shadow-md" role="region" aria-label={label}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground tracking-wide truncate">{label}</p>
            <p
              className="mt-2 text-3xl font-semibold tracking-tight text-foreground font-display"
              aria-label={`${label}: ${value}`}
            >
              {value}
            </p>
            {(subtext != null || trend != null) && (
              <div className="mt-2 flex items-center gap-1">
                {TrendIcon && <TrendIcon className={cn("size-3.5 shrink-0", trendClass)} aria-hidden="true" />}
                {subtext != null && <p className={cn("text-xs", subtextClass)}>{subtext}</p>}
              </div>
            )}
          </div>
          {Icon && (
            <div
              className="ml-4 shrink-0 size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
