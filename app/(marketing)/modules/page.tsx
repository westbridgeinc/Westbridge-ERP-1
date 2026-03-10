"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  FileText,
  Users,
  Package,
  Truck,
  UserCog,
  FolderKanban,
  LayoutGrid,
  Check,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { MODULES, CATEGORIES, isModuleIncludedInPlan } from "@/lib/modules";
import { ROUTES } from "@/lib/config/site";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Finance & Accounting": Calculator,
  "Sales & CRM": Users,
  "Inventory & Supply Chain": Package,
  "HR & Payroll": UserCog,
  "Manufacturing": Truck,
  "Project Management": FolderKanban,
  "Other": LayoutGrid,
};

function planBadge(moduleId: string): { label: string; included: boolean } {
  if (isModuleIncludedInPlan(moduleId, "starter"))    return { label: "Starter+", included: true };
  if (isModuleIncludedInPlan(moduleId, "business"))   return { label: "Business+", included: true };
  if (isModuleIncludedInPlan(moduleId, "enterprise")) return { label: "Enterprise", included: true };
  return { label: "Add-on", included: false };
}

export default function ModulesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered =
    activeCategory === "All"
      ? MODULES
      : MODULES.filter((m) => m.category === activeCategory);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Module catalog
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {MODULES.length} modules. Pick what you need — included in your plan or available as an add-on.
          </p>
        </div>
        <Link
          href={ROUTES.signup}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 whitespace-nowrap"
        >
          Get started free
        </Link>
      </div>

      {/* Category tabs */}
      <div className="mt-8 overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-0">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Module count */}
      <p className="mt-4 text-sm text-muted-foreground">
        Showing {filtered.length} module{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Module grid */}
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mod) => {
          const Icon = CATEGORY_ICONS[mod.category] ?? FileText;
          const badge = planBadge(mod.id);

          return (
            <div
              key={mod.id}
              className="flex flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              {/* Icon + badge row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <span
                  className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    badge.included
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {badge.included ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {badge.label}
                </span>
              </div>

              {/* Name & description */}
              <p className="mt-4 text-base font-semibold text-foreground">{mod.name}</p>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground leading-relaxed">
                {mod.description}
              </p>

              {/* Price row */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                {badge.included ? (
                  <span className="text-sm text-muted-foreground">Included in plan</span>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    Add-on bundle
                    <span className="text-xs font-normal text-muted-foreground"> — see pricing</span>
                  </span>
                )}
                <Link
                  href={`${ROUTES.signup}?module=${mod.id}`}
                  className="inline-flex items-center rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                >
                  Get started
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 rounded-2xl border border-border bg-muted/40 px-8 py-10 text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Need everything? Start with a full plan.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Professional includes 33 modules. Enterprise includes all {MODULES.length}.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={ROUTES.pricing}
            className="inline-flex items-center rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Compare plans
          </Link>
          <Link
            href={ROUTES.signup}
            className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </div>
  );
}
