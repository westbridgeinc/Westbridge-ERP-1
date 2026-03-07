import Link from "next/link";
import { ROUTES } from "@/lib/config/site";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link href={ROUTES.dashboard} className="text-muted-foreground/40 transition-colors hover:opacity-100">
        Dashboard
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <span aria-hidden>/</span>
          {item.href ? (
            <Link href={item.href} className="text-muted-foreground/40 transition-colors hover:opacity-100">
              {item.label}
            </Link>
          ) : (
            <span className="text-muted-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
