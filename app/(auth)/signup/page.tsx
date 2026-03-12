"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import { MODULES as MODULE_LIST, PLANS, CATEGORIES, getPlan, isModuleIncludedInPlan } from "@/lib/modules";
import { CARIBBEAN_COUNTRIES, INDUSTRIES } from "@/lib/demo-data";
import { ROUTES } from "@/lib/config/site";
import type { PlanId } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { validatePassword, TOTAL_PW_REQUIREMENTS } from "@/lib/password-policy";

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stepFromUrl = Math.min(4, Math.max(1, parseInt(searchParams.get("step") ?? "1", 10) || 1));
  const [step, setStepState] = useState(stepFromUrl);
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("United States");
  const [employees, setEmployees] = useState(5);
  const [planId, setPlanId] = useState<PlanId>("starter");
  const [addOnIds, setAddOnIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [step1Errors, setStep1Errors] = useState<{ company?: string; industry?: string }>({});
  const [emailTouched, setEmailTouched] = useState(false);
  const [, setEmailValid] = useState(false);

  const validateEmail = useCallback((value: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value.trim());
  }, []);

  const setStep = useCallback(
    (s: number) => {
      setStepState(s);
      const url = new URL(window.location.href);
      url.searchParams.set("step", String(s));
      router.replace(url.pathname + url.search, { scroll: false });
    },
    [router]
  );

  const returnFromPayment = searchParams.get("success") === "true";

  // Fetch CSRF token on mount and auto-refresh every 4 minutes to prevent
  // token expiry during long signup flows.
  useEffect(() => {
    const fetchCsrf = () => {
      fetch(`${API_BASE}/api/csrf`, { credentials: "include" })
        .then((r) => r.json())
        .then((d: { data?: { token?: string }; token?: string }) => setCsrfToken(d.data?.token ?? d.token ?? null))
        .catch(() => setCsrfToken(null));
    };
    fetchCsrf();
    const interval = setInterval(fetchCsrf, 4 * 60 * 1000); // Refresh every 4 min
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (returnFromPayment) setStep(4);
  }, [returnFromPayment, setStep]);

  useEffect(() => {
    setStepState(stepFromUrl);
  }, [stepFromUrl]);

  const plan = getPlan(planId);
  const addOnCount = addOnIds.size;

  const toggleAddOn = (id: string) => {
    if (isModuleIncludedInPlan(id, planId)) return;
    setAddOnIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href={ROUTES.home} className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">W</div>
            <span className="font-semibold text-sm tracking-wide text-foreground font-display">WESTBRIDGE</span>
          </Link>
          <Link href={ROUTES.login} className="text-sm text-muted-foreground">Sign in</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-xl px-6 py-12">
        <div className="mb-8 flex justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full ${step >= s ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-display">Tell us about your business</h1>
            <form
              className="mt-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const err: { company?: string; industry?: string } = {};
                if (!company.trim()) err.company = "Required";
                if (!industry) err.industry = "Required";
                setStep1Errors(err);
                if (Object.keys(err).length === 0) setStep(2);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="signup-company">Company name</Label>
                <Input
                  id="signup-company"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (step1Errors.company) setStep1Errors((p) => ({ ...p, company: undefined }));
                  }}
                  placeholder="e.g. Acme Industries Inc."
                />
                {step1Errors.company && (
                  <p className="text-sm text-destructive" role="alert">{step1Errors.company}</p>
                )}
              </div>
              <Select value={industry} onValueChange={(v) => { setIndustry(v); if (step1Errors.industry) setStep1Errors((p) => ({ ...p, industry: undefined })); }}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {CARIBBEAN_COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(employees)} onValueChange={(v) => setEmployees(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Number of employees" /></SelectTrigger>
                <SelectContent>
                  {[1, 5, 10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n === 100 ? "100+" : String(n)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                variant="default"
                size="lg"
                type="submit"
                className="mt-6 h-11 w-full"
                disabled={!company.trim() || !industry}
              >
                Continue
              </Button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-display">Choose your plan</h1>
            <p className="mt-2 text-sm text-muted-foreground/60">Flat monthly pricing. No per-user fees. Scale with overage billing.</p>
            <div className="mt-6 space-y-3">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  className={cn(
                    "w-full min-h-[44px] rounded-xl border-2 p-4 text-left transition",
                    planId === p.id ? "border-primary bg-muted" : "border-border hover:opacity-90"
                  )}
                >
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">{p.name}</span>
                    <span className="text-foreground">${p.pricePerMonth.toLocaleString()}/mo</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground/60">{p.limits.users === -1 ? "Unlimited users" : `Up to ${p.limits.users} users`} · {p.limits.storageGB === -1 ? "Unlimited storage" : `${p.limits.storageGB} GB`}</p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" size="default" type="button" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="default" size="lg" type="button" className="h-11 flex-1" onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-display">Pick modules</h1>
            <p className="mt-2 text-sm text-muted-foreground/60">Included in {plan.name}. Add more below if needed.</p>
            <div className="mt-6 max-h-[60vh] overflow-y-auto pr-2 md:max-h-80">
              {CATEGORIES.map((cat) => {
                const catModules = MODULE_LIST.filter((m) => m.category === cat);
                if (catModules.length === 0) return null;
                return (
                  <div key={cat} className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{cat}</p>
                    <div className="space-y-2">
                      {catModules.map((m) => {
                        const included = isModuleIncludedInPlan(m.id, planId);
                        const isAddOn = addOnIds.has(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => !included && toggleAddOn(m.id)}
                            disabled={included}
                            className={`flex min-h-[44px] w-full justify-between items-center rounded-lg border p-3 text-left text-sm transition ${
                              included ? "cursor-default border-border bg-muted opacity-90" : isAddOn ? "border-primary bg-muted" : "border-border hover:opacity-90"
                            }`}
                          >
                            <span className="font-medium text-foreground">{m.name}</span>
                            {included ? (
                              <span className="text-xs text-muted-foreground/60">Included</span>
                            ) : (
                              <span className="text-muted-foreground">Add-on</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 rounded-lg border border-border bg-muted p-4">
              <p className="text-sm font-medium text-foreground">{plan.name} — ${plan.pricePerMonth.toLocaleString()}/mo</p>
              <p className="mt-0.5 text-xs text-muted-foreground/60">Flat monthly pricing · {addOnCount} add-on{addOnCount !== 1 ? "s" : ""} selected</p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" size="default" type="button" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button variant="default" size="lg" type="button" className="h-11 flex-1" onClick={() => setStep(4)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            {returnFromPayment ? (
              <>
                <h1 className="text-2xl font-semibold text-foreground font-display">Payment submitted</h1>
                <p className="mt-2 text-muted-foreground">
                  Your payment is being processed. We&apos;ll activate your account shortly and email you at <strong>{email || "your email"}</strong>.
                </p>
                <Link
                  href={ROUTES.login}
                  className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Go to sign in
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-foreground font-display">Create your account</h1>
                <form
                  className="mt-8 space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSignupError(null);
                    if (!csrfToken) {
                      setSignupError("Security token missing. Please refresh the page.");
                      return;
                    }
                    setSubmitting(true);
                    try {
                      const res = await fetch(`${API_BASE}/api/signup`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                          "Content-Type": "application/json",
                          "X-CSRF-Token": csrfToken,
                        },
                        body: JSON.stringify({
                          name,
                          email,
                          password,
                          companyName: company,
                          plan: plan.name,
                          modulesSelected: [...plan.includedBundleIds, ...addOnIds],
                        }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        if (res.status === 403) {
                          setSignupError("Session expired. Please refresh and try again.");
                          setCsrfToken(null);
                          return;
                        }
                        const msg = typeof data?.error === "object" ? data.error?.message : data?.error;
                        setSignupError(msg || "Signup failed");
                        return;
                      }
                      const payload = data.data ?? data;
                      if (payload.paymentUrl) {
                        // Validate payment URL to prevent open redirect attacks.
                        // Only allow HTTPS URLs on trusted 2Checkout domains.
                        const ALLOWED_PAYMENT_HOSTS = ["secure.2checkout.com", "www.2checkout.com", "2checkout.com"];
                        try {
                          const paymentUrlObj = new URL(payload.paymentUrl);
                          if (paymentUrlObj.protocol !== "https:" || !ALLOWED_PAYMENT_HOSTS.includes(paymentUrlObj.hostname)) {
                            setSignupError("Invalid payment URL received. Please contact support.");
                            return;
                          }
                        } catch {
                          setSignupError("Invalid payment URL received. Please contact support.");
                          return;
                        }
                        window.location.href = payload.paymentUrl;
                        return;
                      }
                      setSignupError(payload.message || "Account created. Contact support to complete payment.");
                    } catch {
                      setSignupError("Something went wrong. Please try again.");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailValid(validateEmail(e.target.value));
                      }}
                      onBlur={() => {
                        setEmailTouched(true);
                        setEmailValid(validateEmail(email));
                      }}
                    />
                    {emailTouched && email.trim() && !validateEmail(email) && (
                      <p className="text-sm text-destructive" role="alert">Enter a valid email address</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {password.length > 0 && (() => {
                      const pwResult = validatePassword(password);
                      const passed = TOTAL_PW_REQUIREMENTS - pwResult.errors.length;
                      return (
                        <>
                          <ul className="mt-2 space-y-1 text-xs">
                            {pwResult.errors.length === 0 ? (
                              <li className="text-success">\u2713 Password meets all requirements</li>
                            ) : (
                              pwResult.errors.map((e) => (
                                <li key={e} className="text-destructive">\u2717 {e}</li>
                              ))
                            )}
                          </ul>
                          <div className="mt-2 flex gap-1">
                            {Array.from({ length: TOTAL_PW_REQUIREMENTS }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                  i < passed
                                    ? passed === TOTAL_PW_REQUIREMENTS
                                      ? "bg-success"
                                      : passed >= 4
                                        ? "bg-warning"
                                        : "bg-destructive"
                                    : "bg-border"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  {signupError && <p className="text-sm text-destructive">{signupError}</p>}
                  <Button
                    variant="default"
                    size="lg"
                    type="submit"
                    disabled={
                      submitting ||
                      !csrfToken ||
                      !validateEmail(email) ||
                      !validatePassword(password).valid
                    }
                    className="mt-6 h-11 w-full"
                  >
                    {!csrfToken ? "Loading\u2026" : submitting ? "Setting up your workspace\u2026" : "Continue to payment (2Checkout)"}
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground/40">You&apos;ll complete payment securely via 2Checkout. Cards and local payment methods supported.</p>
                </form>
                <button type="button" onClick={() => setStep(3)} className="mt-4 text-sm text-muted-foreground/60 hover:opacity-100">
                  Back
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground/60">Loading&hellip;</div>}>
      <SignupContent />
    </Suspense>
  );
}
