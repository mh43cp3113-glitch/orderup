import { prisma } from "@/lib/prisma";

const SECRET_FIELD_BY_SOURCE = {
  swiggy: "swiggyWebhookSecret",
  zomato: "zomatoWebhookSecret",
  website: "websiteWebhookSecret",
} as const;

/**
 * Each client has its own per-aggregator secret (since each business has its own
 * Swiggy/Zomato partner account) — resolve which client a webhook call belongs to by
 * matching the secret, rather than comparing against a single platform-wide value.
 */
export async function resolveClientFromWebhookSecret(source: string, secret: string | null) {
  const field = SECRET_FIELD_BY_SOURCE[source as keyof typeof SECRET_FIELD_BY_SOURCE];
  if (!field || !secret) return null;

  return prisma.client.findFirst({ where: { [field]: secret, isActive: true } });
}
