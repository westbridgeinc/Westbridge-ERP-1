"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/lib/config/site";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const BELIEFS = [
  {
    title: "ERP should work on day one.",
    description:
      "Not after a six-month implementation engagement. Westbridge connects to your ERPNext instance and surfaces real data in minutes, not quarters.",
  },
  {
    title: "Local compliance should be built in, not bolted on.",
    description:
      "VAT filings, NIS deductions, GYD/TTD/BBD multi-currency, and Caribbean payroll rules are first-class features — not afterthoughts or paid add-ons.",
  },
  {
    title: "Your data stays yours.",
    description:
      "Westbridge is self-hostable and fully exportable. No lock-in, no proprietary formats. If you ever leave, you take everything with you.",
  },
];

const STATS = [
  { label: "38 modules", sublabel: "Finance, HR, inventory, CRM, and more" },
  { label: "3 plans", sublabel: "Starter · Business · Enterprise" },
  { label: "Caribbean-first", sublabel: "Multi-currency: GYD, TTD, BBD, JMD, USD" },
];

export default function AboutContent() {
  return (
    <div className="mx-auto max-w-6xl bg-background px-6 py-24">

      {/* Headline */}
      <motion.div {...fadeUp}>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          About Westbridge
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground font-display">
          Enterprise operations infrastructure for the Caribbean and emerging markets.
        </h1>
      </motion.div>

      {/* Mission */}
      <motion.div {...fadeUp} transition={{ delay: 0.06 }} className="mt-10 max-w-2xl">
        <p className="text-base leading-relaxed text-muted-foreground">
          Westbridge was founded to give Caribbean and emerging-market businesses the same
          operations infrastructure that Fortune 500 companies use — invoicing, inventory,
          HR, payroll, CRM, and financial reporting — without the enterprise price tag or
          the six-month implementation. We built it because we kept seeing the same problem:
          growing businesses running critical operations on spreadsheets, WhatsApp threads,
          and four disconnected SaaS tools that never quite talked to each other.
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.1 }}
        className="mt-16 grid grid-cols-1 gap-px rounded-2xl border border-border bg-border sm:grid-cols-3"
      >
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 bg-card px-8 py-8 first:rounded-l-2xl last:rounded-r-2xl">
            <p className="text-2xl font-semibold tracking-tight text-foreground">{stat.label}</p>
            <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
          </div>
        ))}
      </motion.div>

      {/* What we believe */}
      <motion.div {...fadeUp} transition={{ delay: 0.14 }} className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground font-display">What we believe</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {BELIEFS.map((belief, i) => (
            <motion.div
              key={belief.title}
              {...fadeUp}
              transition={{ delay: 0.14 + i * 0.08 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <p className="text-base font-semibold text-foreground">{belief.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{belief.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* What's built in */}
      <motion.div {...fadeUp} transition={{ delay: 0.22 }} className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground font-display">
          What&apos;s built in
        </h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[
            {
              label: "Claude AI — every module",
              body: "Ask questions about your business in plain English. Westbridge AI can query live ERP data, summarise your financials, flag overdue invoices, and draft documents — scoped to your company, your data, your plan.",
            },
            {
              label: "Caribbean-first compliance",
              body: "VAT filings, NIS deductions, GYD/TTD/BBD/JMD multi-currency, and local payroll rules are built in — not bolt-ons. The platform is designed for how businesses in the Caribbean and emerging markets actually operate.",
            },
            {
              label: "Enterprise infrastructure, startup price",
              body: "Role-based access, full audit log, session security, CSRF protection, and SOC 2-aligned controls — the same infrastructure a Fortune 500 would require, available from the first month.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              {...fadeUp}
              transition={{ delay: 0.22 + i * 0.08 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <p className="text-base font-semibold text-foreground">{item.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="mt-24 rounded-2xl bg-primary py-16 text-center text-primary-foreground">
        <h2 className="text-2xl font-semibold tracking-tight font-display">Ready to get started?</h2>
        <p className="mt-3 text-sm text-primary-foreground/70">
          No credit card required. Up and running in minutes.
        </p>
        <Link
          href={ROUTES.signup}
          className="mt-6 inline-block rounded-md bg-primary-foreground px-6 py-2.5 text-sm font-medium text-primary transition hover:opacity-90"
        >
          Start free trial
        </Link>
      </motion.div>
    </div>
  );
}
