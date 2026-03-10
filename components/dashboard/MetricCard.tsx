import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  subtextVariant?: "default" | "success" | "error" | "muted";
  icon?: React.ComponentType<{ className?: string }>;
  trend?: number;
}

export function MetricCard({
  label,
  value,
  subtext,
  subtextVariant = "muted",
  icon: Icon,
  trend,
}: MetricCardProps) {
  const subtextClass =
    subtextVariant === "success"
      ? "text-success"
      : subtextVariant === "error"
        ? "text-destructive"
        : subtextVariant === "default"
          ? "text-muted-foreground"
          : "text-muted-foreground/60";

  const TrendIcon =
    trend != null
      ? trend > 0
        ? TrendingUp
        : trend < 0
          ? TrendingDown
          : Minus
      : null;

  const trendClass =
    trend != null
      ? trend > 0
        ? "text-success"
        : trend < 0
          ? "text-destructive"
          : "text-muted-foreground"
      : "";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        {(subtext != null || trend != null) && (
          <div className="mt-1 flex items-center gap-1">
            {TrendIcon && <TrendIcon className={cn("size-3.5", trendClass)} />}
            {subtext != null && (
              <p className={cn("text-xs", subtextClass)}>{subtext}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
