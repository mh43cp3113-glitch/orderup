"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { recalcOrderTotals } from "@/lib/orders";
import { generateOrderNumber } from "@/lib/generate-number";
import type { OrderStatus, OrderType, KitchenStatus } from "@/generated/prisma/enums";

const STAFF_ROLES = ["ADMIN", "MANAGER", "CASHIER", "WAITER"] as const;

export async function createOrder(formData: FormData) {
  const user = await requireRole([...STAFF_ROLES]);
  const clientId = user.clientId;

  const type = formData.get("type") as OrderType;
  const tableId = (formData.get("tableId") as string) || null;
  const customerPhone = (formData.get("customerPhone") as string)?.trim();
  const customerName = (formData.get("customerName") as string)?.trim();

  let customerId: string | undefined;
  if (customerPhone) {
    const customer = await prisma.customer.upsert({
      where: { clientId_phone: { clientId, phone: customerPhone } },
      update: customerName ? { name: customerName } : {},
      create: { name: customerName || "Guest", phone: customerPhone, clientId },
    });
    customerId = customer.id;
  }

  const todaysCount = await prisma.order.count({
    where: { clientId, createdAt: { gte: startOfDay(new Date()) } },
  });
  const orderNumber = generateOrderNumber(todaysCount + 1);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      type,
      clientId,
      tableId: type === "DINE_IN" ? tableId : null,
      customerId,
      waiterId: user.id,
    },
  });

  if (type === "DINE_IN" && tableId) {
    await prisma.restaurantTable.updateMany({
      where: { id: tableId, clientId },
      data: { status: "OCCUPIED" },
    });
  }

  revalidatePath("/tables");
  redirect(`/orders/${order.id}`);
}

export async function addOrderItem(
  orderId: string,
  _prev: string | undefined,
  formData: FormData,
) {
  const { clientId } = await requireRole([...STAFF_ROLES]);

  const order = await prisma.order.findFirst({ where: { id: orderId, clientId } });
  if (!order) return "Order not found";

  const menuItemId = formData.get("menuItemId") as string;
  const variantId = formData.get("variantId") as string;
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  const notes = (formData.get("notes") as string) || undefined;

  if (!menuItemId || !variantId) return "Select an item and price variant";

  const variant = await prisma.menuItemVariant.findFirst({
    where: { id: variantId, menuItem: { id: menuItemId, clientId } },
  });
  if (!variant) return "Invalid item or price variant";

  const unitPrice = Number(variant.price);
  const totalPrice = unitPrice * quantity;

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.create({
      data: { orderId, menuItemId, variantId, quantity, unitPrice, totalPrice, notes },
    });

    const recipe = await tx.recipeIngredient.findMany({ where: { menuItemId } });
    for (const ri of recipe) {
      await tx.ingredient.update({
        where: { id: ri.ingredientId },
        data: { quantityInStock: { decrement: Number(ri.quantityRequired) * quantity } },
      });
    }
  });

  await recalcOrderTotals(orderId);
  revalidatePath(`/orders/${orderId}`);
  return undefined;
}

export async function removeOrderItem(orderItemId: string) {
  const { clientId } = await requireRole([...STAFF_ROLES]);

  const item = await prisma.orderItem.findFirst({
    where: { id: orderItemId, order: { clientId } },
  });
  if (!item) throw new Error("Order item not found");

  await prisma.$transaction(async (tx) => {
    const recipe = await tx.recipeIngredient.findMany({ where: { menuItemId: item.menuItemId } });
    for (const ri of recipe) {
      await tx.ingredient.update({
        where: { id: ri.ingredientId },
        data: { quantityInStock: { increment: Number(ri.quantityRequired) * item.quantity } },
      });
    }
    await tx.orderItem.delete({ where: { id: orderItemId } });
  });

  await recalcOrderTotals(item.orderId);
  revalidatePath(`/orders/${item.orderId}`);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER", "CASHIER", "WAITER", "CHEF"]);

  const order = await prisma.order.findFirst({ where: { id: orderId, clientId } });
  if (!order) throw new Error("Order not found");

  await prisma.order.update({ where: { id: orderId }, data: { status } });

  if ((status === "COMPLETED" || status === "CANCELLED") && order.tableId) {
    await prisma.restaurantTable.updateMany({
      where: { id: order.tableId, clientId },
      data: { status: "CLEANING" },
    });
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/tables");
}

export async function cancelOrder(orderId: string) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER", "CASHIER"]);

  const order = await prisma.order.findFirst({ where: { id: orderId, clientId } });
  if (!order) throw new Error("Order not found");

  const items = await prisma.orderItem.findMany({ where: { orderId } });

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const recipe = await tx.recipeIngredient.findMany({ where: { menuItemId: item.menuItemId } });
      for (const ri of recipe) {
        await tx.ingredient.update({
          where: { id: ri.ingredientId },
          data: { quantityInStock: { increment: Number(ri.quantityRequired) * item.quantity } },
        });
      }
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  });

  if (order.tableId) {
    await prisma.restaurantTable.updateMany({
      where: { id: order.tableId, clientId },
      data: { status: "CLEANING" },
    });
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/tables");
}

export async function updateKitchenStatus(orderItemId: string, status: KitchenStatus) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER", "CHEF"]);

  const item = await prisma.orderItem.findFirst({
    where: { id: orderItemId, order: { clientId } },
  });
  if (!item) throw new Error("Order item not found");

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { kitchenStatus: status },
  });
  revalidatePath(`/orders/${item.orderId}`);
  revalidatePath("/kitchen");
}
