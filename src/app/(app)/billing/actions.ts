"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { generateBillNumber } from "@/lib/generate-number";
import { DEFAULT_TAX_RATE } from "@/lib/constants";
import type { PaymentMethod } from "@/generated/prisma/enums";

export async function recordPayment(
  orderId: string,
  _prev: string | undefined,
  formData: FormData,
) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER", "CASHIER"]);

  const method = formData.get("method") as PaymentMethod;
  const amount = Number(formData.get("amount"));
  const couponCode = (formData.get("couponCode") as string)?.trim() || undefined;

  if (!amount || amount <= 0) return "Enter a valid payment amount";

  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId },
    include: { bill: true, items: true },
  });
  if (!order) return "Order not found";

  if (order.items.length === 0) return "Cannot bill an order with no items";

  let bill = order.bill;

  if (!bill) {
    let discountAmount = 0;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { clientId_code: { clientId, code: couponCode } },
      });
      if (!coupon || !coupon.isActive || (coupon.expiresAt && coupon.expiresAt < new Date())) {
        return "Invalid or expired coupon code";
      }
      discountAmount =
        coupon.type === "PERCENTAGE"
          ? (Number(order.subtotal) * Number(coupon.value)) / 100
          : Number(coupon.value);
    }

    const subtotal = Number(order.subtotal);
    const taxAmount = Number(order.taxAmount);
    const totalAmount = Math.max(subtotal + taxAmount - discountAmount, 0);

    const todaysCount = await prisma.bill.count({
      where: { clientId, createdAt: { gte: startOfDay(new Date()) } },
    });

    bill = await prisma.bill.create({
      data: {
        billNumber: generateBillNumber(todaysCount + 1),
        clientId,
        orderId,
        subtotal,
        taxRate: DEFAULT_TAX_RATE,
        taxAmount,
        discountAmount,
        couponCode,
        totalAmount,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { discountAmount, totalAmount },
    });
  }

  await prisma.payment.create({
    data: { orderId, method, amount, status: "PAID" },
  });

  const allPayments = await prisma.payment.findMany({ where: { orderId } });
  const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  if (totalPaid >= Number(bill.totalAmount)) {
    await prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } });
    if (order.tableId) {
      await prisma.restaurantTable.updateMany({
        where: { id: order.tableId, clientId },
        data: { status: "CLEANING" },
      });
    }
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/billing");
  revalidatePath("/tables");
  return undefined;
}
