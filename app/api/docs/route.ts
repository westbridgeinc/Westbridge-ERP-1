/**
 * GET /api/docs — serves the OpenAPI 3.1 JSON spec.
 * Interactive UI is rendered at /api/docs/ui (if configured).
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { generateOpenApiSpec } = await import("@/lib/api/openapi");
  const spec = generateOpenApiSpec();
  return NextResponse.json(spec, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
