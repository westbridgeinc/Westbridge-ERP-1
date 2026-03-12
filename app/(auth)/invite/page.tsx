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
import { validatePassword, TOTAL_PW_REQUIREMENTS } from "@/lib/password-policy";

interface InviteInfo {
  email: string;
  role: string;
  companyName: string;
}

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/csrf`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCsrfToken(d?.data?.token ?? ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) { setInviteError("Missing invite token."); setLoading(false); return; }
    fetch(`${API_BASE}/api/invite?token=${encodeURIComponent(token)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok && d.error) { setInviteError(d.error.message ?? d.error ?? "Invalid invite"); return; }
        setInviteInfo({ email: d.data.email, role: d.data.role, companyName: d.data.companyName });
      })
      .catch(() => setInviteError("Failed to load invite. Please try again."))
      .finally(() => setLoading(false));
  }, [token]);

  const pwResult = validatePassword(password);
  const passwordsMatch = password === confirm && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pwResult.valid || !passwordsMatch) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/invite/accept`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data?.error?.message ?? data?.error ?? "Something went wrong.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push(ROUTES.login), 2500);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground">Verifying invite&hellip;</div>;
  }

  if (inviteError) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-destructive">{inviteError}</p>
        <Link href={ROUTES.login} className="mt-4 block text-sm font-medium text-primary hover:underline">
          Go to sign in
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
          <h1 className="text-lg font-semibold text-foreground font-display">Account ready!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Redirecting you to sign in&hellip;</p>
        </div>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-foreground font-display">Join {inviteInfo?.companyName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;ve been invited as a <strong className="text-foreground">{inviteInfo?.role}</strong>. Set up your account below.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{inviteInfo?.email}</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={submitting || !name.trim() || !pwResult.valid || !passwordsMatch}
              className="h-10 w-full"
            >
              {submitting ? "Setting up account\u2026" : "Create account"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading&hellip;</div>}>
          <InviteContent />
        </Suspense>
      </div>
    </div>
  );
}
