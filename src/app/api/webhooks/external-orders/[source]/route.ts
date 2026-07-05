import { NextRequest, NextResponse } from "next/server";
import { resolveClientFromWebhookSecret } from "@/lib/webhook-auth";
import { createExternalOrder, externalOrderSchema } from "@/lib/external-orders";
import type { OrderSource } from "@/generated/prisma/enums";

const VALID_SOURCES: Record<string, OrderSource> = {
  swiggy: "SWIGGY",
  zomato: "ZOMATO",
  website: "WEBSITE",
};

/**
 * Generic inbound webhook for order aggregators. This is NOT wired to Swiggy or
 * Zomato's real APIs — those require an approved partner/business agreement before
 * any credentials or payload docs are issued. This endpoint accepts our own normalized
 * payload (see externalOrderSchema) so the rest of the order pipeline (kitchen, billing,
 * inventory deduction) already works the moment real partner integration is signed off —
 * only the payload-translation step at the top of this handler needs to change then.
 *
 * Auth: each client has its own per-source secret (Client.swiggyWebhookSecret etc,
 * visible in the super-admin client detail page) sent via the `x-webhook-secret`
 * header — the client is resolved by matching the secret, not a shared platform value.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ source: string }> }) {
  const { source: rawSource } = await params;
  const sourceKey = rawSource.toLowerCase();
  const source = VALID_SOURCES[sourceKey];

  if (!source) {
    return NextResponse.json({ error: "Unknown order source" }, { status: 404 });
  }

  const secret = req.headers.get("x-webhook-secret");
  const client = await resolveClientFromWebhookSecret(sourceKey, secret);
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = externalOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const result = await createExternalOrder(client.id, source, parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 422 },
    );
  }
}
