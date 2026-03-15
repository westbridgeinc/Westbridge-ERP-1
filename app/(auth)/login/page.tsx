"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
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
  const [csrfLoaded, setCsrfLoaded] = useState(false);
  const [, setFailedAttempts] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/csrf`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: { data?: { token?: string }; token?: string }) => setCsrfToken(d.data?.token ?? d.token ?? null))
      .catch(() => setCsrfToken(null))
      .finally(() => setCsrfLoaded(true));
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
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        credentials: "include",
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
      // If the proxy returned a session token, set the httpOnly cookie via POST
      // then navigate to the dashboard.
      const sessionToken = data?.data?.sessionToken;
      if (sessionToken) {
        const sessionRes = await fetch("/api/auth/session", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: sessionToken }),
        });
        if (!sessionRes.ok) {
          setError("Failed to establish session. Please try again.");
          return;
        }
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
      {/* Left: brand panel — hidden on mobile */}
      <div
        className="hidden min-h-screen w-[50%] flex-col items-center justify-center md:flex relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.40 0.18 250) 0%, oklch(0.25 0.18 255) 100%)" }}
      >
        {/* Decorative dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-white/15 flex items-center justify-center">
              <span className="text-white font-bold text-lg font-display">W</span>
            </div>
            <span className="text-white font-semibold text-xl tracking-wide font-display">WESTBRIDGE</span>
          </div>
          <p className="text-white/70 text-sm leading-relaxed max-w-[280px]">
            Enterprise intelligence for growing businesses
          </p>
          <div className="mt-12 w-full max-w-[280px] space-y-3">
            {["Multi-module ERP dashboard", "Real-time financial insights", "Enterprise-grade security"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="size-1.5 rounded-full bg-white/50 shrink-0" />
                <span className="text-white/60 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: white panel, form */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background md:w-[50%]">
        <div className="w-full max-w-[400px] px-6 md:px-8">
          {/* Mobile: show small logo */}
          <div className="mb-8 flex justify-center md:hidden">
            <Logo variant="mark" size="md" className="text-foreground" />
          </div>

          <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your Westbridge account</p>

          {!csrfLoaded ? (
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
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-11 rounded-md border-border focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 rounded-md border-border focus-visible:ring-ring"
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
                <Link
                  href="/forgot-password"
                  className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
                >
                  Forgot your password?
                </Link>
              </p>

              <Button type="submit" disabled={loading} className="h-11 w-full">
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.signup}
              className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
            >
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
