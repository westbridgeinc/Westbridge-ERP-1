"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/config/site";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/lib/password-policy";

const TOTAL_PW_REQUIREMENTS = 6;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/csrf`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCsrfToken(d?.data?.token ?? ""))
      .catch(() => {});
  }, []);

  const pwResult = validatePassword(password);
  const passwordsMatch = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pwResult.valid || !passwordsMatch) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? data?.error ?? "Reset failed. The link may have expired.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push(ROUTES.login), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-destructive">Invalid reset link. Please request a new one.</p>
        <Link href="/forgot-password" className="mt-4 block text-sm font-medium text-primary hover:underline">
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
      {success ? (
        <div className="text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-foreground font-display">Password updated</h1>
          <p className="mt-2 text-sm text-muted-foreground">Redirecting you to sign in&hellip;</p>
        </div>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-foreground font-display">Set new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password.length > 0 && (
                <>
                  <ul className="mt-1 space-y-1 text-xs">
                    {pwResult.errors.length === 0 ? (
                      <li className="text-success">\u2713 Password meets all requirements</li>
                    ) : (
                      pwResult.errors.map((e) => <li key={e} className="text-destructive">\u2717 {e}</li>)
                    )}
                  </ul>
                  <div className="flex gap-1">
                    {Array.from({ length: TOTAL_PW_REQUIREMENTS }).map((_, i) => {
                      const passed = TOTAL_PW_REQUIREMENTS - pwResult.errors.length;
                      return (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < passed
                              ? passed === TOTAL_PW_REQUIREMENTS ? "bg-success" : passed >= 4 ? "bg-warning" : "bg-destructive"
                              : "bg-border"
                          }`}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {confirm.length > 0 && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={loading || !pwResult.valid || !passwordsMatch}
              className="h-10 w-full"
            >
              {loading ? "Updating\u2026" : "Update password"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading&hellip;</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
