interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  subtextVariant?: "default" | "success" | "error" | "muted";
}

export function MetricCard({ label, value, subtext, subtextVariant = "muted" }: MetricCardProps) {
  const subtextClass =
    subtextVariant === "success"
      ? "text-emerald-500"
      : subtextVariant === "error"
        ? "text-destructive"
        : subtextVariant === "default"
          ? "text-muted-foreground"
          : "text-muted-foreground/60";

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {subtext != null && (
        <p className={`mt-1 text-sm ${subtextClass}`}>
          {subtext}
        </p>
      )}
    </div>
  );
}
