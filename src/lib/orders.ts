import { prisma } from "@/lib/prisma";
import { DEFAULT_TAX_RATE } from "@/lib/constants";

export async function recalcOrderTotals(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const taxAmount = Math.round(subtotal * (DEFAULT_TAX_RATE / 100) * 100) / 100;

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const discountAmount = Number(order.discountAmount);
  const totalAmount = Math.max(subtotal + taxAmount - discountAmount, 0);

  await prisma.order.update({
    where: { id: orderId },
    data: { subtotal, taxAmount, totalAmount },
  });
}
