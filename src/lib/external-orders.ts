import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recalcOrderTotals } from "@/lib/orders";
import { generateOrderNumber } from "@/lib/generate-number";
import { startOfDay } from "date-fns";
import type { OrderSource } from "@/generated/prisma/enums";

/**
 * Normalized payload shape this app expects from any aggregator. Swiggy/Zomato's real
 * partner-API payloads are only available after partner onboarding — once you have
 * those docs, translate their shape into this one at the top of the webhook handler
 * rather than changing everything downstream.
 */
export const externalOrderSchema = z.object({
  externalOrderId: z.string().min(1),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        variant: z.string().optional(),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().nonnegative(),
      }),
    )
    .min(1),
});

export type ExternalOrderPayload = z.infer<typeof externalOrderSchema>;

export async function createExternalOrder(
  clientId: string,
  source: OrderSource,
  payload: ExternalOrderPayload,
) {
  const existing = await prisma.order.findUnique({
    where: { clientId_source_externalOrderId: { clientId, source, externalOrderId: payload.externalOrderId } },
  });
  if (existing) {
    return { orderId: existing.id, orderNumber: existing.orderNumber, duplicate: true };
  }

  let customerId: string | undefined;
  if (payload.customerPhone) {
    const customer = await prisma.customer.upsert({
      where: { clientId_phone: { clientId, phone: payload.customerPhone } },
      update: payload.customerName ? { name: payload.customerName } : {},
      create: { name: payload.customerName || "Guest", phone: payload.customerPhone, clientId },
    });
    customerId = customer.id;
  }

  const unmatched: string[] = [];
  const resolvedItems: {
    menuItemId: string;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
  }[] = [];

  for (const item of payload.items) {
    const menuItem = await prisma.menuItem.findFirst({
      where: { clientId, name: { equals: item.name, mode: "insensitive" } },
      include: { variants: true },
    });

    if (!menuItem) {
      unmatched.push(`${item.name}${item.variant ? ` (${item.variant})` : ""}`);
      continue;
    }

    const variant =
      menuItem.variants.find(
        (v) => item.variant && v.name.toLowerCase() === item.variant.toLowerCase(),
      ) ?? menuItem.variants.find((v) => v.isDefault) ?? menuItem.variants[0];

    resolvedItems.push({
      menuItemId: menuItem.id,
      variantId: variant?.id ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
  }

  if (resolvedItems.length === 0) {
    throw new Error(`No items could be matched to the menu: ${unmatched.join(", ")}`);
  }

  const todaysCount = await prisma.order.count({
    where: { clientId, createdAt: { gte: startOfDay(new Date()) } },
  });

  const notesParts = [payload.notes, unmatched.length > 0 ? `Unmatched items: ${unmatched.join(", ")}` : null].filter(
    Boolean,
  );

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(todaysCount + 1),
        type: "DELIVERY",
        status: "CONFIRMED",
        source,
        clientId,
        externalOrderId: payload.externalOrderId,
        customerId,
        notes: notesParts.length > 0 ? notesParts.join(" | ") : undefined,
        items: {
          create: resolvedItems.map((item) => ({
            menuItemId: item.menuItemId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
    });

    for (const item of resolvedItems) {
      const recipe = await tx.recipeIngredient.findMany({ where: { menuItemId: item.menuItemId } });
      for (const ri of recipe) {
        await tx.ingredient.update({
          where: { id: ri.ingredientId },
          data: { quantityInStock: { decrement: Number(ri.quantityRequired) * item.quantity } },
        });
      }
    }

    return created;
  });

  await recalcOrderTotals(order.id);

  return { orderId: order.id, orderNumber: order.orderNumber, duplicate: false, unmatched };
}
