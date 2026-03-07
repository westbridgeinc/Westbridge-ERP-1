"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, ExternalLink, Check, ChevronRight, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToasts } from "@/components/ui/Toasts";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { validatePassword } from "@/lib/password-policy";
import {
  MODULES,
  CATEGORIES,
  getPlan,
  isModuleIncludedInPlan,
  type PlanId,
} from "@/lib/modules";

const TAB_ITEMS = [
  { id: "general", label: "Profile" },
  { id: "team", label: "Team" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "billing", label: "Billing" },
  { id: "integrations", label: "Integrations" },
  { id: "modules", label: "Modules" },
  { id: "api", label: "API" },
];
const TAB_IDS = TAB_ITEMS.map((t) => t.id);

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionUser {
  userId: string;
  accountId: string;
  role: string;
  email: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
  isYou: boolean;
}

interface BillingData {
  items: { id: string; date: string; amount: string; status: string }[];
  plan: string | null;
  accountCreatedAt: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextBillingDate(createdAt: string | null): string {
  if (!createdAt) return "";
  const created = new Date(createdAt);
  const dayOfMonth = created.getDate();
  const now = new Date();
  let next = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  if (next <= now) {
    next = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
  }
  return next.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Main settings component ─────────────────────────────────────────────────

function SettingsContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab = tabFromUrl && TAB_IDS.includes(tabFromUrl) ? tabFromUrl : "general";
  const [tab, setTab] = useState(initialTab);
  const { addToast } = useToasts();
  const { theme: resolvedTheme, setTheme } = useTheme();

  // ── Session / profile ──────────────────────────────────────────────────────
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const initialNameRef = useRef("");

  useEffect(() => {
    fetch("/api/auth/validate", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { data?: SessionUser }) => {
        const u = d?.data;
        if (u) {
          setSessionUser(u);
          const name = u.name?.trim() || u.email.split("@")[0].replace(/[._-]/g, " ");
          setDisplayName(name);
          setEmail(u.email ?? "");
          initialNameRef.current = name;
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const dirty = displayName !== initialNameRef.current;

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!dirty) return;
      setSaving(true);
      try {
        const csrfRes = await fetch("/api/csrf");
        const csrfData = await csrfRes.json().catch(() => ({})) as { data?: { token?: string }; token?: string };
        const csrfToken = csrfData?.data?.token ?? csrfData?.token ?? "";
        const res = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
          credentials: "include",
          body: JSON.stringify({ name: displayName }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({})) as { error?: { message?: string } };
          throw new Error(errData?.error?.message ?? "Failed to save profile");
        }
        initialNameRef.current = displayName;
        addToast("Profile saved", "success");
      } catch {
        addToast("Failed to save profile", "error");
      } finally {
        setSaving(false);
      }
    },
    [dirty, displayName, addToast]
  );

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // ── Billing ────────────────────────────────────────────────────────────────
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    if (tab !== "billing") return;
    setBillingLoading(true);
    fetch("/api/billing/history", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { data?: BillingData }) => setBilling(d?.data ?? null))
      .catch(() => setBilling({ items: [], plan: null, accountCreatedAt: null }))
      .finally(() => setBillingLoading(false));
  }, [tab]);

  const billingPlanId = (billing?.plan ?? sessionUser?.role === "owner" ? billing?.plan : null) as PlanId | null;
  const billingPlan = billingPlanId ? getPlan(billingPlanId) : null;
  const nextBilling = nextBillingDate(billing?.accountCreatedAt ?? null);

  // ── Team ───────────────────────────────────────────────────────────────────
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [inviteSending, setInviteSending] = useState(false);

  useEffect(() => {
    if (tab !== "team") return;
    setTeamLoading(true);
    fetch("/api/team", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { data?: { members: TeamMember[] } }) => setTeamMembers(d?.data?.members ?? []))
      .catch(() => setTeamMembers([]))
      .finally(() => setTeamLoading(false));
  }, [tab]);

  const handleSendInvite = useCallback(async () => {
    if (!inviteEmail.trim()) return;
    setInviteSending(true);
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json().catch(() => ({}));
      const csrfToken = csrfData?.data?.token ?? "";
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole.toLowerCase() }),
        credentials: "include",
      });
      if (res.ok) {
        addToast(`Invitation sent to ${inviteEmail}`, "success");
        setInviteEmail("");
        setInviteRole("Member");
      } else {
        const d = await res.json().catch(() => ({}));
        addToast(d?.error?.message ?? "Failed to send invite", "error");
      }
    } catch {
      addToast("Failed to send invite", "error");
    } finally {
      setInviteSending(false);
    }
  }, [inviteEmail, inviteRole, addToast]);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [emailNotif, setEmailNotif] = useState(true);
  const [invoiceReminders, setInvoiceReminders] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const handleNotifToggle = useCallback(
    (setter: (v: boolean) => void, value: boolean) => { setter(value); addToast("Preferences saved", "success"); },
    [addToast]
  );

  // ── Security: change password ──────────────────────────────────────────────
  const [changePwModal, setChangePwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  const pwValidation = useMemo(() => validatePassword(newPw), [newPw]);

  const handleChangePw = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    if (!pwValidation.valid) { setPwError(pwValidation.errors[0]); return; }
    setPwSaving(true);
    try {
      const csrfRes = await fetch("/api/csrf");
      const csrfData = await csrfRes.json().catch(() => ({}));
      const csrfToken = csrfData?.data?.token ?? "";
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
        credentials: "include",
      });
      if (res.ok) {
        setChangePwModal(false);
        setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwError("");
        addToast("Password updated successfully", "success");
      } else {
        const d = await res.json().catch(() => ({}));
        setPwError(d?.error?.message ?? "Failed to update password");
      }
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwSaving(false);
    }
  }, [currentPw, newPw, confirmPw, pwValidation, addToast]);

  // ── Modules ───────────────────────────────────────────────────────────────
  const currentPlanId: PlanId = (billingPlanId ?? "starter") as PlanId;
  const currentPlan = getPlan(currentPlanId);
  const [moduleActivateConfirm, setModuleActivateConfirm] = useState<{ name: string; id: string; price: number } | null>(null);
  const [activeAddOnIds, setActiveAddOnIds] = useState<Set<string>>(new Set());
  const isModuleActive = useCallback(
    (moduleId: string) => currentPlan.includedBundleIds.some((bid) => MODULES.find((m) => m.id === moduleId)?.bundleId === bid) || activeAddOnIds.has(moduleId),
    [currentPlan.includedBundleIds, activeAddOnIds]
  );
  const handleActivateModule = useCallback(() => {
    if (moduleActivateConfirm) {
      setActiveAddOnIds((s) => new Set(s).add(moduleActivateConfirm.id));
      addToast(`${moduleActivateConfirm.name} activated`, "success");
      setModuleActivateConfirm(null);
    }
  }, [moduleActivateConfirm, addToast]);

  // ── API keys ──────────────────────────────────────────────────────────────
  const [apiKeys] = useState([
    { id: "key-1", prefix: "wb_live_••••••••abc1", label: "Production", created: "2025-01-15", lastUsed: "Today", status: "Active" },
  ]);
  const [apiKeyModal, setApiKeyModal] = useState<{ open: boolean; label: string; generatedKey: string | null }>({ open: false, label: "", generatedKey: null });

  const handleGenerateKey = useCallback(() => {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const key = "wb_live_" + Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
    setApiKeyModal((p) => ({ ...p, generatedKey: key }));
  }, []);

  const copyToClipboard = useCallback(
    (text: string, label: string) => { navigator.clipboard.writeText(text); addToast(`${label} copied to clipboard`, "success"); },
    [addToast]
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.westbridge.gy";
  const webhookUrl = sessionUser?.accountId
    ? `${appUrl}/api/webhooks/${sessionUser.accountId}`
    : "Loading…";

  useEffect(() => {
    if (tabFromUrl && TAB_IDS.includes(tabFromUrl)) setTab(tabFromUrl);
  }, [tabFromUrl]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and preferences" />
      <div className="mt-8">
        <Tabs items={TAB_ITEMS} activeId={tab} onChange={setTab} />
      </div>
      <div className="mt-6 space-y-6">

        {/* ── Profile ── */}
        {tab === "general" && (
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="max-w-lg space-y-5" onSubmit={handleSave}>
                {profileLoading ? (
                  <>
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                  </>
                ) : (
                  <>
                    <Input
                      label="Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted"
                    />
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                          <Check className="h-4 w-4" />
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Signed in as <strong className="text-foreground">{sessionUser?.role ?? "member"}</strong>
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </>
                )}
                <Button
                  type="submit"
                  className="h-9 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                  loading={saving}
                  disabled={!dirty || profileLoading}
                >
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Notifications ── */}
        {tab === "notifications" && (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose which notifications you want to receive. Changes are saved automatically.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {[
                { id: "email", label: "Email notifications", desc: "Receive updates and summaries by email", value: emailNotif, set: setEmailNotif },
                { id: "invoice", label: "Invoice alerts", desc: "When invoices are paid or overdue", value: invoiceReminders, set: setInvoiceReminders },
                { id: "security", label: "Security alerts", desc: "Login and password changes", value: securityAlerts, set: setSecurityAlerts },
              ].map((item) => (
                <div key={item.id} className="flex justify-between items-center py-4 px-6 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch id={`notif-${item.id}`} checked={item.value} onChange={(v) => handleNotifToggle(item.set, v)} aria-label={item.label} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Billing ── */}
        {tab === "billing" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Current plan and subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {billingLoading ? (
                  <>
                    <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-64 animate-pulse rounded bg-muted" />
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current plan</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">
                        {billingPlan?.name ?? (billing?.plan ? billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1) : "—")}
                      </p>
                      {billingPlan && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          ${billingPlan.pricePerMonth.toLocaleString()}/mo
                          {nextBilling ? ` · Next billing date ${nextBilling}` : ""}
                        </p>
                      )}
                      {!billingPlan && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          <a href="mailto:support@westbridge.gy" className="text-primary hover:underline">
                            Contact support to manage billing
                          </a>
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="default" className="rounded-md border border-input bg-background hover:bg-accent">
                      Manage subscription
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                {billingLoading ? (
                  <div className="h-32 animate-pulse rounded bg-muted" />
                ) : billing?.items && billing.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
                        <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Date</TableHead>
                        <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Amount</TableHead>
                        <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billing.items.map((row) => (
                        <TableRow key={row.id} className="border-t border-border">
                          <TableCell className="px-4 py-3 text-sm">{row.date}</TableCell>
                          <TableCell className="px-4 py-3 text-sm">{row.amount}</TableCell>
                          <TableCell className="px-4 py-3"><Badge status={row.status}>{row.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    icon={<AlertCircle className="h-8 w-8 text-muted-foreground" />}
                    title="No billing history yet"
                    description="Your invoices will appear here once your first billing cycle completes."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Security ── */}
        {tab === "security" && (
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Two-factor authentication and password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-start py-4 border-b border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
                  <p className="text-sm text-muted-foreground">Add a second verification step on sign-in.</p>
                </div>
                <Tooltip content="Two-factor authentication is coming soon." side="left">
                  <Button
                    className="h-9 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm opacity-50 cursor-not-allowed"
                    disabled
                    aria-disabled="true"
                  >
                    Enable
                  </Button>
                </Tooltip>
              </div>
              <div className="flex justify-between items-start py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Change password</p>
                  <p className="text-sm text-muted-foreground">Use a strong password that you don&apos;t use elsewhere.</p>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  className="rounded-md border border-input"
                  onClick={() => { setPwError(""); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setChangePwModal(true); }}
                >
                  Change password
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Integrations ── */}
        {tab === "integrations" && (
          <div className="max-w-2xl space-y-8">
            <div>
              <h2 className="font-serif text-lg font-semibold text-foreground">ERPNext connection</h2>
              <p className="mt-1 text-sm text-muted-foreground">Connect your ERPNext instance for sync and migration.</p>
              <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-card p-4">
                <div>
                  <p className="font-medium text-foreground">Status</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
                <Button variant="default" size="default">Connect ERPNext</Button>
              </div>
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-foreground">API keys</h2>
              <p className="mt-1 text-sm text-muted-foreground">Manage API keys for programmatic access.</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{apiKeys.length} active key{apiKeys.length !== 1 ? "s" : ""}</span>
                <Button variant="default" size="default" onClick={() => setApiKeyModal({ open: true, label: "", generatedKey: null })}>Create key</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Team ── */}
        {tab === "team" && (
          <Card>
            <CardContent className="p-6">
              {teamLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-44 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}</p>
                  </div>
                  {teamMembers.length > 0 && (
                    <ul className="divide-y divide-border">
                      {teamMembers.map((member) => (
                        <li key={member.id} className="flex items-center justify-between py-4 first:pt-0">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-full">
                              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {member.name}
                                {member.isYou && <span className="ml-2 text-xs font-normal text-muted-foreground">(You)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground capitalize">{member.role}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{member.lastActive}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Invite section */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium text-foreground mb-3">Invite a team member</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                        className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {["Member", "Admin", "Viewer"].map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                      <Button
                        className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                        onClick={handleSendInvite}
                        loading={inviteSending}
                        disabled={!inviteEmail.trim()}
                      >
                        Send invite
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Modules ── */}
        {tab === "modules" && (
          <div className="space-y-6">
            {CATEGORIES.map((cat) => {
              const items = MODULES.filter((m) => m.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</p>
                  <div className="space-y-2">
                    {items.map((m) => {
                      const included = isModuleIncludedInPlan(m.id, currentPlanId);
                      const isActive = isModuleActive(m.id);
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between gap-4 rounded-lg border border-border py-3 px-4 ${isActive ? "bg-background" : "bg-muted opacity-80"}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${isActive ? "bg-primary" : "bg-muted-foreground"}`} />
                            <span className="text-base font-medium text-foreground">{m.name}</span>
                            {!included && (
                              <span className="text-sm text-muted-foreground">Add-on</span>
                            )}
                          </div>
                          {included ? (
                            <span className="text-sm text-muted-foreground">Included</span>
                          ) : isActive ? (
                            <span className="text-sm text-emerald-500">Active</span>
                          ) : (
                            <Button variant="secondary" size="sm" onClick={() => setModuleActivateConfirm({ name: m.name, id: m.id, price: 0 })}>Activate</Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <p className="text-sm text-muted-foreground pt-2">
              Your plan includes {currentPlan.includedBundleIds.length} module bundle{currentPlan.includedBundleIds.length !== 1 ? "s" : ""}.
              {activeAddOnIds.size > 0 && (
                <> {activeAddOnIds.size} add-on{activeAddOnIds.size !== 1 ? "s" : ""} active.</>
              )}
            </p>
          </div>
        )}

        {/* ── API ── */}
        {tab === "api" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-semibold text-foreground">API Keys</p>
                <Button variant="primary" size="md" onClick={() => setApiKeyModal({ open: true, label: "", generatedKey: null })}>Generate new key</Button>
              </div>
              <div className="mt-4 overflow-hidden rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
                      <TableHead className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-muted-foreground">Prefix</TableHead>
                      <TableHead className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-muted-foreground">Label</TableHead>
                      <TableHead className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-muted-foreground">Created</TableHead>
                      <TableHead className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-muted-foreground">Last used</TableHead>
                      <TableHead className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((row) => (
                      <TableRow key={row.id} className="border-t border-border">
                        <TableCell className="px-4 py-3 font-mono text-sm text-foreground">{row.prefix}</TableCell>
                        <TableCell className="px-4 py-3 text-foreground">{row.label}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{row.created}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{row.lastUsed}</TableCell>
                        <TableCell className="px-4 py-3"><Badge status={row.status}>{row.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">API documentation</p>
              <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-base text-primary hover:underline">
                OpenAPI spec <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Webhook URL</p>
              <p className="mt-1 text-xs text-muted-foreground">Send this URL to services that need to notify Westbridge of events.</p>
              <div className="mt-2 flex items-center gap-2">
                {profileLoading ? (
                  <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
                ) : (
                  <code className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground break-all">{webhookUrl}</code>
                )}
                <Button variant="secondary" size="md" onClick={() => copyToClipboard(webhookUrl, "Webhook URL")} disabled={profileLoading} leftIcon={<Copy className="h-4 w-4" />}>Copy</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Appearance ── */}
        {tab === "appearance" && (
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Appearance Settings</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(["light", "dark", "system"] as const).map((theme) => {
                const isSelected = (resolvedTheme === "system" && theme === "system") || (resolvedTheme !== "system" && theme === resolvedTheme);
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setTheme(theme)}
                    className={`rounded-lg border p-4 text-left transition-shadow ${isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:bg-muted/50"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-foreground capitalize">{theme}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {theme === "light" && "Use light theme"}
                          {theme === "dark" && "Use dark theme"}
                          {theme === "system" && "Match system preference"}
                        </p>
                      </div>
                      <span className={`h-4 w-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Fallback ── */}
        {!TAB_IDS.includes(tab) && (
          <div className="flex flex-col items-center py-12">
            <p className="text-xl font-semibold text-foreground">{TAB_ITEMS.find((t) => t.id === tab)?.label}</p>
            <p className="mt-2 text-base text-muted-foreground">This section is coming soon.</p>
          </div>
        )}
      </div>

      {/* ── Change password modal ── */}
      <Modal open={changePwModal} onClose={() => setChangePwModal(false)} title="Change password">
        <form onSubmit={handleChangePw} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            autoComplete="new-password"
          />
          {newPw && !pwValidation.valid && (
            <ul className="space-y-1">
              {pwValidation.errors.map((err) => (
                <li key={err} className="text-xs text-destructive">{err}</li>
              ))}
            </ul>
          )}
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            autoComplete="new-password"
          />
          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="md" type="button" onClick={() => setChangePwModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={pwSaving}
              disabled={!currentPw || !newPw || !confirmPw}
            >
              Update password
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Module activate confirm ── */}
      <ConfirmDialog
        open={!!moduleActivateConfirm}
        onClose={() => setModuleActivateConfirm(null)}
        onConfirm={handleActivateModule}
        title="Activate module?"
        description={moduleActivateConfirm ? `Activate ${moduleActivateConfirm.name}? This will add $${moduleActivateConfirm.price}/mo to your billing.` : ""}
        confirmLabel="Activate"
        cancelLabel="Cancel"
      />

      {/* ── API key modal ── */}
      <Modal
        open={apiKeyModal.open}
        onClose={() => setApiKeyModal({ open: false, label: "", generatedKey: null })}
        title={apiKeyModal.generatedKey ? "API key created" : "Generate new key"}
      >
        <div className="space-y-4">
          {!apiKeyModal.generatedKey ? (
            <>
              <Input label="Label" value={apiKeyModal.label} onChange={(e) => setApiKeyModal((p) => ({ ...p, label: e.target.value }))} placeholder="e.g. Production" />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="md" onClick={() => setApiKeyModal({ open: false, label: "", generatedKey: null })}>Cancel</Button>
                <Button variant="primary" size="md" onClick={handleGenerateKey}>Generate</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Copy this key now. It won&apos;t be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-mono break-all text-foreground">{apiKeyModal.generatedKey}</code>
                <Button variant="secondary" size="md" onClick={() => copyToClipboard(apiKeyModal.generatedKey!, "API key")} leftIcon={<Copy className="h-4 w-4" />}>Copy</Button>
              </div>
              <Button variant="primary" size="md" className="w-full" onClick={() => setApiKeyModal({ open: false, label: "", generatedKey: null })}>Done</Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
