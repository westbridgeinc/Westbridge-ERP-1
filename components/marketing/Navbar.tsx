"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ROUTES } from "@/lib/config/site";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: ROUTES.modules, label: "Features" },
  { href: ROUTES.pricing, label: "Pricing" },
  { href: ROUTES.about, label: "About" },
];

const SCROLL_THRESHOLD = 24;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 h-16 transition-all duration-200",
        scrolled
          ? "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <Link href={ROUTES.home} className="inline-flex text-foreground hover:opacity-90">
          <Logo variant="full" size="sm" />
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href={ROUTES.login}
            className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href={ROUTES.signup}>Get Started</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.div
              className="fixed inset-y-0 right-0 z-30 flex w-full max-w-[300px] flex-col border-l border-border bg-background md:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.2 }}
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <Logo variant="full" size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-md"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-6 px-6 py-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-[13px] font-medium uppercase tracking-wider text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-3 border-t border-border pt-6">
                  <Link href={ROUTES.login} onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-center">
                      Sign in
                    </Button>
                  </Link>
                  <Link href={ROUTES.signup} onClick={() => setMobileOpen(false)}>
                    <Button className="w-full justify-center">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
