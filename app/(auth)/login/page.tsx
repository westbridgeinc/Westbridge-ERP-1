"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ROUTES } from "@/lib/config/site";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [, setFailedAttempts] = useState(0);

  useEffect(() => {
    fetch("/api/csrf")
      .then((r) => r.json())
      .then((d: { data?: { token?: string }; token?: string }) => setCsrfToken(d.data?.token ?? d.token ?? null))
      .catch(() => setCsrfToken(null));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!csrfToken) {
      setError("Security token missing. Please refresh the page.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) {
          setError("Session expired. Please refresh and try again.");
          setCsrfToken(null);
          return;
        }
        const msg = typeof data?.error === "object" ? data.error?.message : data?.error;
        setError(msg || "Invalid credentials");
        setFailedAttempts((n) => n + 1);
        return;
      }
      router.push(ROUTES.dashboard);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setFailedAttempts((n) => n + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left: black panel with WB monogram — hidden on mobile except minimal */}
      <div className="hidden min-h-screen w-[50%] flex-col items-center justify-center bg-black px-12 md:flex">
        <div className="flex flex-col items-center text-center">
          <span className="font-serif text-8xl font-bold leading-none text-white">WB</span>
          <span className="mt-4 font-sans text-[10px] font-medium uppercase tracking-[0.25em] text-white/90">
            Westbridge
          </span>
          <span className="mt-1 font-sans text-[8px] font-light uppercase tracking-[0.2em] text-white/70">
            Inc.
          </span>
        </div>
      </div>

      {/* Right: white panel, form */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background md:w-[50%]">
        <div className="w-full max-w-[400px] px-6 md:px-8">
          {/* Mobile: show small logo */}
          <div className="mb-8 flex justify-center md:hidden">
            <Logo variant="mark" size="md" className="text-foreground" />
          </div>

          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account
          </p>

          {csrfToken === null ? (
            <div className="mt-8 space-y-5" aria-busy="true">
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-11 w-full rounded-md border border-input bg-muted/50" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-11 w-full rounded-md border border-input bg-muted/50" />
              </div>
              <div className="mt-8 h-11 w-full rounded-md bg-muted" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-11 rounded-md border-border focus-visible:ring-black"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 rounded-md border-border focus-visible:ring-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-md">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <p className="text-sm text-muted-foreground">
                <Link href="/forgot-password" className="font-medium text-foreground underline underline-offset-2 hover:no-underline">
                  Forgot your password?
                </Link>
              </p>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href={ROUTES.signup} className="font-medium text-foreground underline underline-offset-2 hover:no-underline">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
