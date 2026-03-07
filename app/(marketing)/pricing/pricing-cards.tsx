"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap, Info } from "lucide-react";
import { PLANS, MODULE_BUNDLES, formatLimit } from "@/lib/modules";
import { ROUTES } from "@/lib/config/site";
import { formatCurrency } from "@/lib/locale/currency";

const USAGE_ROWS = [
  { label: "Users",                  key: "users" as const,              unit: "users" },
  { label: "Storage",                key: "storageGB" as const,          unit: "GB" },
  { label: "ERP records / mo",       key: "erpRecordsPerMonth" as const,  unit: "" },
  { label: "Claude AI queries / mo", key: "aiQueriesPerMonth" as const,  unit: "" },
  { label: "API calls / mo",         key: "apiCallsPerMonth" as const,   unit: "" },
];

export function PricingCards() {
  const [annual, setAnnual] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  return (
    <>
      {/* Billing toggle */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
        <button
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${annual ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${annual ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}>
          Annual
          <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            Save 2 months
          </span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const price = annual ? plan.annualPricePerMonth : plan.pricePerMonth;
          const isPopular = plan.id === "business";
          const bundles = MODULE_BUNDLES.filter((b) => plan.includedBundleIds.includes(b.id));

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-card p-7 transition-shadow hover:shadow-xl ${
                isPopular ? "border-primary shadow-lg ring-2 ring-primary" : "border-border"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow">
                  {plan.badge}
                </span>
              )}

              {/* Plan name + price */}
              <p className="text-lg font-bold text-foreground">{plan.name}</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-5xl font-bold tracking-tight text-foreground">
                  {formatCurrency(price, "USD")}
                </span>
                <span className="mb-1.5 text-sm text-muted-foreground">/mo</span>
              </div>
              {annual
                ? <p className="mt-1 text-xs text-muted-foreground/60">Billed annually — {formatCurrency(price * 12, "USD")}/yr</p>
                : <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(plan.annualPricePerMonth, "USD")}/mo billed annually</p>
              }

              {/* AI badge */}
              <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">
                  {plan.limits.aiQueriesPerMonth === -1
                    ? "Unlimited Claude AI"
                    : `${plan.limits.aiQueriesPerMonth} AI queries / mo`}
                </span>
              </div>

              {/* Included bundles */}
              <div className="mt-5 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">Included modules</p>
                {bundles.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    {b.name}
                  </div>
                ))}
              </div>

              {/* Features */}
              <ul className="mt-5 flex-1 space-y-2 border-t border-border pt-4">
                {plan.features.slice(2).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.id === "enterprise" ? "mailto:sales@westbridge.gy" : ROUTES.signup}
                className={`mt-7 flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-all duration-150 ${
                  isPopular
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {plan.id === "enterprise" ? "Talk to sales" : "Start free trial"}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Usage limits comparison toggle */}
      <div className="mx-auto mt-8 max-w-5xl">
        <button
          onClick={() => setShowUsage((v) => !v)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Info className="h-4 w-4" />
          {showUsage ? "Hide" : "Show"} usage limits & overage rates
        </button>

        {showUsage && (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="py-3 pl-5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">Limit</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {USAGE_ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-border">
                    <td className="py-3 pl-5 font-medium text-foreground">{row.label}</td>
                    {PLANS.map((p) => (
                      <td key={p.id} className="py-3 px-4 text-center text-muted-foreground">
                        {formatLimit(p.limits[row.key], row.unit)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-muted/40">
                  <td className="py-3 pl-5 font-semibold text-foreground">Overage — extra user</td>
                  {PLANS.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-center text-muted-foreground">
                      {p.overageRates.perExtraUser === 0 ? "—" : `$${p.overageRates.perExtraUser}/user/mo`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 pl-5 font-semibold text-foreground">Overage — extra AI query</td>
                  {PLANS.map((p) => (
                    <td key={p.id} className="py-3 px-4 text-center text-muted-foreground">
                      {p.overageRates.perExtraAiQuery === 0 ? "—" : `$${p.overageRates.perExtraAiQuery}/query`}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add-on bundles */}
      <div className="mx-auto mt-8 max-w-5xl rounded-xl border border-border bg-muted/40 p-5">
        <p className="text-sm font-bold text-foreground">Need additional modules?</p>
        <p className="mt-1 text-sm text-muted-foreground">Add bundles to any plan. All bundles include Claude AI features.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MODULE_BUNDLES.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
              <Zap className="h-3 w-3 text-primary" />
              {b.name} — <span className="text-primary font-semibold">{formatCurrency(b.standalonePrice, "USD")}/mo</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
