"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  ShoppingCart,
  Package,
  Calculator,
  Users,
  FolderKanban,
  Check,
} from "lucide-react";
import { ROUTES, TRIAL } from "@/lib/config/site";
import { PLANS } from "@/lib/modules";
import { Button } from "@/components/ui/Button";
import { BackgroundBeams } from "@/components/aceternity/BackgroundBeams";
import { TextGenerateEffect } from "@/components/aceternity/TextGenerateEffect";
import { BentoGrid } from "@/components/aceternity/BentoGrid";
import { InfiniteMovingCards } from "@/components/aceternity/InfiniteMovingCards";
import { Card, CardContent } from "@/components/ui/Card";

const BENTO_CARDS = [
  { title: "Sales & Invoicing", description: "Quotations, orders, and invoices in one place. Track payments and overdue items.", icon: <FileText className="h-5 w-5" /> },
  { title: "Procurement", description: "Purchase orders, supplier management, and three-way matching.", icon: <ShoppingCart className="h-5 w-5" /> },
  { title: "Inventory Management", description: "Stock levels, warehouses, and movement tracking across locations.", icon: <Package className="h-5 w-5" /> },
  { title: "Accounting & Finance", description: "General ledger, chart of accounts, journal entries, and financial reports.", icon: <Calculator className="h-5 w-5" /> },
  { title: "Human Resources", description: "Employees, attendance, payroll, and leave management.", icon: <Users className="h-5 w-5" /> },
  { title: "Projects & Timesheets", description: "Projects, tasks, and time tracking for accurate billing.", icon: <FolderKanban className="h-5 w-5" /> },
];

function DashboardPreview() {
  const [imageError, setImageError] = useState(false);
  if (imageError) {
    return (
      <div className="w-full max-w-4xl h-64 mx-auto rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
        Dashboard Preview
      </div>
    );
  }
  return (
    <Image
      src="/images/dashboard-preview.png"
      alt="Westbridge dashboard"
      width={1200}
      height={675}
      className="w-full max-w-4xl mx-auto rounded-xl border border-border shadow-xl"
      onError={() => setImageError(true)}
    />
  );
}

const TESTIMONIALS = [
  {
    quote: "We closed our first external audit in 3 days instead of 3 weeks. Everything was already in one place — invoices, GL entries, expense claims. The auditor didn't ask for a single spreadsheet.",
    name: "Anita Ramkissoon",
    company: "Trident Distribution Ltd",
    role: "CFO, Trinidad",
  },
  {
    quote: "We were running payroll on a spreadsheet for 31 employees. Migrating to Westbridge took one afternoon. We imported our employee list, configured the salary structure, and ran payroll the same week.",
    name: "Jerome Baptiste",
    company: "Baptiste & Sons Construction",
    role: "Operations Manager, Barbados",
  },
  {
    quote: "The multi-currency support is what sold us. We invoice in USD and GYD, deal with TTD suppliers, and need NIS calculations done right. Every other platform either didn't support it or charged extra for it.",
    name: "Natasha Persaud",
    company: "Persaud Trading Co.",
    role: "Owner, Guyana",
  },
];

export function HomeContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-20">
        <BackgroundBeams className="opacity-60" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Enterprise resource planning
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-[56px]">
            Run your business with clarity
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground">
            <TextGenerateEffect
              words="Westbridge brings enterprise-grade ERP to growing companies. Manage sales, inventory, accounting, HR, and projects — all in one place."
              duration={1.2}
            />
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-md bg-primary px-8 text-primary-foreground">
              <Link href={ROUTES.signup}>Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-md px-8">
              <Link href={ROUTES.modules}>See Features</Link>
            </Button>
          </div>
          <div className="mt-12 w-full max-w-4xl mx-auto">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-t border-border bg-muted/20 py-6">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {[
            "38 modules",
            "Caribbean-first compliance",
            "No lock-in",
          ].map((point, i) => (
            <span key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
              {i > 0 && <span className="hidden text-border sm:inline" aria-hidden>·</span>}
              {point}
            </span>
          ))}
        </div>
      </section>

      {/* Features - Bento */}
      <section className="border-t border-border bg-background px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-foreground">
            Everything you need
          </h2>
          <div className="mt-12">
            <BentoGrid cards={BENTO_CARDS} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/20 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-3">
            {[
              { step: "1", title: "Sign up", desc: "Create your account in 60 seconds." },
              { step: "2", title: "Configure", desc: "Set up your modules and team." },
              { step: "3", title: "Operate", desc: "Run your entire business from one dashboard." },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                <span className="font-display text-4xl font-semibold text-muted-foreground/80">{item.step}</span>
                <h3 className="mt-2 font-display text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                {item.step !== "3" && (
                  <div className="absolute left-[60%] top-8 hidden h-px w-[80%] bg-border md:block" aria-hidden />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border bg-background py-20">
        <div className="mx-auto max-w-6xl px-6">
          <InfiniteMovingCards cards={TESTIMONIALS} className="[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]" />
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border bg-muted/20 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-foreground">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Per user, per month. No setup fees. Cancel anytime.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PLANS.slice(0, 3).map((plan) => {
              const isPopular = plan.id === "business";
              const cta = plan.id === "enterprise" ? "Contact Sales" : "Start Free Trial";
              const href = plan.id === "enterprise" ? ROUTES.about : ROUTES.signup;
              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${isPopular ? "ring-2 ring-primary" : ""}`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                      Most Popular
                    </span>
                  )}
                  <CardContent className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-semibold text-foreground">{plan.name}</h3>
                    <p className="mt-4 text-3xl font-bold text-foreground">
                      ${plan.pricePerMonth.toLocaleString()}
                      <span className="text-base font-normal text-muted-foreground">/mo</span>
                    </p>
                    <ul className="mt-6 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="mt-auto w-full rounded-md bg-primary text-primary-foreground" size="lg">
                      <Link href={href}>{cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary px-6 py-20 text-primary-foreground">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Ready to streamline your business?
          </h2>
          <Button asChild size="lg" className="mt-8 rounded-md bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link href={ROUTES.signup}>Get started free</Link>
          </Button>
          <p className="mt-4 text-sm text-primary-foreground/80">
            No credit card required. {TRIAL.days}-day free trial.
          </p>
        </div>
      </section>
    </>
  );
}
