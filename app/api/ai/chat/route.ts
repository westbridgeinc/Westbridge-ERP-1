import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { anthropic, AI_MODELS } from "@/lib/ai/claude";
import { ERP_TOOLS, executeTool } from "@/lib/ai/tools";
import { buildSystemPrompt, type AiModule } from "@/lib/ai/context";
import { checkAiLimit, recordAiUsage } from "@/lib/ai/limits";
import { validateSession } from "@/lib/services/session.service";
import { checkTieredRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit-tiers";
import { securityHeaders } from "@/lib/security-headers";
import { getRedis } from "@/lib/redis";
import { prisma } from "@/lib/data/prisma";
import { COOKIE } from "@/lib/constants";
import type Anthropic from "@anthropic-ai/sdk";
import type { PlanId } from "@/lib/modules";

const schema = z.object({
  message: z.string().min(1).max(4000),
  module: z.enum(["finance","crm","inventory","hr","manufacturing","projects","biztools","general"]).default("general"),
  conversationId: z.string().uuid().optional(),
});

async function getHistory(id: string): Promise<Anthropic.MessageParam[]> {
  const client = getRedis();
  if (!client) return [];
  const raw = await client.get(`ai:conv:${id}`);
  return raw ? (JSON.parse(raw) as Anthropic.MessageParam[]) : [];
}

async function saveHistory(id: string, messages: Anthropic.MessageParam[]): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.set(`ai:conv:${id}`, JSON.stringify(messages.slice(-20)), "EX", 3600);
}

export async function POST(req: Request) {
  const hdrs = securityHeaders();

  // Degrade gracefully when the API key is not configured
  if (!anthropic) {
    return NextResponse.json({
      data: {
        reply: "AI is not configured on this plan yet.",
        conversationId: null,
        usage: { queries: 0, remaining: null },
      },
    }, { status: 200, headers: hdrs });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401, headers: hdrs });
  }

  const sessionResult = await validateSession(token, req);
  if (!sessionResult.ok) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401, headers: hdrs });
  }
  const session = sessionResult.data;

  const rateLimit = await checkTieredRateLimit(session.userId, "authenticated", "/api/ai/chat");
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many AI requests. Try again shortly." } }, { status: 429, headers: { ...hdrs, ...rateLimitHeaders(rateLimit) } });
  }

  // Load account for plan + company info
  const account = await prisma.account.findUnique({
    where: { id: session.accountId },
    select: { plan: true, companyName: true, erpnextCompany: true },
  });
  if (!account) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404, headers: hdrs });
  }

  // Normalise plan to known PlanId
  const rawPlan = account.plan.toLowerCase();
  const planId: PlanId =
    rawPlan === "enterprise" ? "enterprise" :
    rawPlan === "business" ? "business" :
    "starter";

  // Plan AI quota check
  const limitCheck = await checkAiLimit(session.accountId, planId);
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: { code: "AI_LIMIT_REACHED", message: limitCheck.reason },
      usage: limitCheck.usage,
    }, { status: 402, headers: hdrs });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_REQUEST" } }, { status: 400, headers: hdrs });
  }

  const { message, module: aiModule, conversationId = crypto.randomUUID() } = parsed.data;
  const history = await getHistory(conversationId);

  // Load user name for system prompt
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  });

  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: message },
  ];

  const system = buildSystemPrompt({
    companyName: account.companyName,
    planId,
    userName: user?.name ?? "User",
    userRole: session.role,
    currentDate: new Date().toISOString().slice(0, 10),
    moduleContext: aiModule as AiModule,
  });

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let finalResponse: Anthropic.Message | null = null;
  let currentMessages = [...messages];

  // Agentic loop — max 5 rounds of tool use
  for (let round = 0; round < 5; round++) {
    const response = await anthropic.messages.create({
      model: AI_MODELS.chat,
      max_tokens: 4096,
      system,
      tools: ERP_TOOLS,
      messages: currentMessages,
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;
    finalResponse = response;

    if (response.stop_reason === "end_turn") break;

    if (response.stop_reason === "tool_use") {
      const toolBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      currentMessages.push({ role: "assistant", content: response.content });

      const toolResults = await Promise.all(
        toolBlocks.map(async (tb) => ({
          type: "tool_result" as const,
          tool_use_id: tb.id,
          content: await executeTool(
            tb.name,
            tb.input,
            session.erpnextSid ?? "",
            session.accountId,
            account.erpnextCompany ?? null
          ),
        }))
      );
      currentMessages.push({ role: "user", content: toolResults });
    }
  }

  await recordAiUsage(session.accountId, totalInputTokens, totalOutputTokens);

  const textBlock = finalResponse?.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  const reply = textBlock?.text ?? "I couldn't generate a response. Please try again.";

  await saveHistory(conversationId, [
    ...messages,
    { role: "assistant", content: reply },
  ]);

  return NextResponse.json({
    data: {
      reply,
      conversationId,
      usage: {
        queries: limitCheck.usage.queries + 1,
        remaining: limitCheck.remaining.queries !== null ? limitCheck.remaining.queries - 1 : null,
      },
    },
  }, { headers: hdrs });
}
