"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
import { useState, useRef, useEffect } from "react";
import { Zap, X, Send, Loader2, AlertCircle, Sparkles } from "lucide-react";

const AI_NOT_CONFIGURED_MSG = "AI is not configured on this plan yet.";
import ReactMarkdown from "react-markdown";

interface Message { role: "user" | "assistant"; content: string }

interface AIChatPanelProps {
  module?: "finance" | "crm" | "inventory" | "hr" | "manufacturing" | "projects" | "biztools" | "general" | "assets";
}

const SUGGESTIONS: Record<string, string[]> = {
  finance:       ["Summarise last 30 days revenue", "Show overdue invoices", "What are my top 5 expenses?"],
  crm:           ["Show open opportunities", "Which deals are closing this month?", "Draft a quote for Acme Corp"],
  inventory:     ["What items are low on stock?", "Show top 10 selling products", "Forecast reorder needs"],
  hr:            ["Show employees with pending leave", "Any payroll anomalies this month?", "Draft a job description for a Sales Manager"],
  manufacturing: ["Show open work orders", "Which workstations are at capacity?", "Any material shortages?"],
  projects:      ["Show projects at risk of delay", "Which tasks are overdue?", "Summarise this week's timesheet hours"],
  biztools:      ["Show today's POS sales summary", "Which products need restocking?", "Generate a sales trend report"],
  general:       ["How is the business doing?", "Show my most important tasks today", "What needs my attention?"],
};

export function AIChatPanel({ module = "general" }: AIChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convId, setConvId] = useState<string | undefined>();
  const [remaining, setRemaining] = useState<number | null | undefined>(undefined);
  const [aiUnconfigured, setAiUnconfigured] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setError(null);
    setMessages((p) => [...p, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const csrfRes = await fetch(`${API_BASE}/api/csrf`, { credentials: "include" });
      const csrfData = await csrfRes.json().catch(() => ({}));
      const csrfToken = (csrfData as Record<string, unknown>)?.data
        ? ((csrfData as { data: { token?: string } }).data.token ?? "")
        : ((csrfData as { token?: string }).token ?? "");

      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ message: msg, module, conversationId: convId }),
      });
      const json = await res.json() as {
        data?: { conversationId: string; reply: string; usage?: { remaining: number | null } };
        error?: { code: string; message?: string };
      };

      if (!res.ok) {
        const errMsg = json.error?.message ?? "Something went wrong. Please try again.";
        setError(errMsg);
        setMessages((p) => p.slice(0, -1));
        return;
      }

      const reply = json.data?.reply ?? "";
      if (reply === AI_NOT_CONFIGURED_MSG) {
        setAiUnconfigured(true);
        setMessages([]);
        return;
      }
      setConvId(json.data?.conversationId ?? undefined);
      setRemaining(json.data?.usage?.remaining ?? null);
      setMessages((p) => [...p, { role: "assistant", content: reply }]);
    } catch {
      setError("Connection error. Please try again.");
      setMessages((p) => p.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  const suggestions = SUGGESTIONS[module] ?? SUGGESTIONS.general;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-xl transition hover:opacity-90 hover:shadow-2xl"
        aria-label="Open AI Assistant"
      >
        <Zap className="h-4 w-4" />
        {aiUnconfigured ? "AI coming soon" : "Ask AI"}
        {!aiUnconfigured && remaining !== undefined && remaining !== null && remaining <= 20 && (
          <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
            {remaining} left
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 flex h-[540px] w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Westbridge AI</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {module}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {!aiUnconfigured && remaining !== null && remaining !== undefined && (
                <span className="text-xs text-muted-foreground">{remaining} queries left</span>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* AI not configured state */}
          {aiUnconfigured && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">AI coming soon</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Claude AI is being activated for your account. Check back shortly or contact support.
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {!aiUnconfigured && <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="mt-4">
                <p className="text-center text-sm font-medium text-foreground">What do you want to know?</p>
                <div className="mt-4 space-y-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground prose prose-sm dark:prose-invert max-w-none"
                  }`}
                >
                  {m.role === "assistant"
                    ? <ReactMarkdown>{m.content}</ReactMarkdown>
                    : m.content
                  }
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>}

          {/* Input — hidden when AI is unconfigured */}
          {!aiUnconfigured && <div className="border-t border-border p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void send()}
              placeholder="Ask about your business…"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <button
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-primary px-3 py-2 text-primary-foreground disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>}
        </div>
      )}
    </>
  );
}
