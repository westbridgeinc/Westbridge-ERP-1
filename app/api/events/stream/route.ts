/**
 * GET /api/events/stream — Server-Sent Events stream.
 * Clients connect and receive real-time events for their account.
 * Reconnection is handled via the `Last-Event-Id` header.
 */
import { cookies } from "next/headers";
import { validateSession } from "@/lib/services/session.service";
import { subscribe } from "@/lib/realtime";
import { COOKIE } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEEPALIVE_INTERVAL_MS = 25_000;

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE.SESSION_NAME)?.value;
  const result = token ? await validateSession(token, request) : null;
  if (!result?.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { accountId } = result.data;
  let lastEventId = request.headers.get("Last-Event-Id") ?? "0";
  let unsubscribe: (() => Promise<void>) | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: { type: string; payload: unknown; id?: string }) => {
        const id = event.id ?? String(Date.now());
        lastEventId = id;
        controller.enqueue(
          new TextEncoder().encode(
            `id: ${id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`
          )
        );
      };

      // Initial connection confirmation
      send({ type: "connected", payload: { accountId, lastEventId } });

      // Subscribe to Redis Pub/Sub
      unsubscribe = await subscribe(accountId, (event) => {
        send({ type: event.type, payload: event.payload });
      });

      // Keepalive comments to prevent connection timeout
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepalive);
        }
      }, KEEPALIVE_INTERVAL_MS);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepalive);
        unsubscribe?.();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
