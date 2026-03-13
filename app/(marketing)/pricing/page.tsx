export const revalidate = 3600; // 1 hour — marketing pages change infrequently
import { MODULE_ROWS, isModuleIncludedInPlan, getAddOnPrice } from "@/lib/modules";
import type { PlanId } from "@/lib/modules";
import { PricingCards } from "./pricing-cards";

function cellContent(moduleId: string, planId: PlanId): string {
  if (isModuleIncludedInPlan(moduleId, planId)) return "✓";
  const addOn = getAddOnPrice(moduleId, planId);
  if (addOn != null) return `+$${addOn}`;
  return "—";
}

export const metadata = {
  title: "Pricing | Westbridge",
  description: "Simple, transparent pricing. Flat monthly. Unlimited users. Claude AI built into every module.",
  openGraph: {
    title: "Pricing | Westbridge",
    description: "Simple, transparent pricing. Flat monthly. Unlimited users. Claude AI built into every module.",
  },
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground font-display md:text-4xl">
        Simple, transparent pricing
      </h1>
      <p className="mt-3 text-center text-base text-muted-foreground">
        Flat monthly. Unlimited users. Claude AI built into every module.
      </p>

      <PricingCards />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Add-on module bundles available for Starter and Business plans. Enterprise includes all 38 modules.
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground/60">
        Payment is processed securely via PowerTranz — cards and Caribbean payment methods accepted.
      </p>

      <div className="mt-16 overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[600px] border-collapse text-base">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="py-4 pl-6 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                Module
              </th>
              <th className="py-4 px-4 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                Starter
              </th>
              <th className="py-4 px-4 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                Business
              </th>
              <th className="py-4 px-4 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                Enterprise
              </th>
            </tr>
          </thead>
          <tbody>
            {MODULE_ROWS.map((row, index) => {
              const showCategory = index === 0 || row.category !== MODULE_ROWS[index - 1].category;
              return (
                <tr key={row.moduleId} className="border-b border-border transition-colors hover:bg-muted">
                  <td className="py-3 pl-6">
                    {showCategory && (
                      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground/60">
                        {row.category}
                      </span>
                    )}
                    <span className="font-medium text-foreground">{row.module}</span>
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    {cellContent(row.moduleId, "starter")}
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    {cellContent(row.moduleId, "business")}
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    {cellContent(row.moduleId, "enterprise")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
