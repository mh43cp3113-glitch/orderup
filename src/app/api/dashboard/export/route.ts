import { NextResponse } from "next/server";
import { startOfDay, subDays, format } from "date-fns";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";

export async function GET() {
  const clientId = await requireCurrentClientId();
  const today = startOfDay(new Date());

  const [todaysBills, ingredients, allOrders] = await Promise.all([
    prisma.bill.findMany({ where: { clientId, createdAt: { gte: today } } }),
    prisma.ingredient.findMany({ where: { clientId } }),
    prisma.order.findMany({
      where: { clientId, status: { not: "CANCELLED" }, items: { some: {} } },
      include: { payments: true },
    }),
  ]);

  const todaysSales = todaysBills.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const pendingOrders = allOrders.filter((order) => {
    const paid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return Number(order.totalAmount) - paid > 0.01;
  });
  const pendingAmount = pendingOrders.reduce((sum, order) => {
    const paid = order.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + (Number(order.totalAmount) - paid);
  }, 0);

  const lowStockIngredients = ingredients.filter(
    (i) => Number(i.quantityInStock) <= Number(i.reorderLevel),
  );

  const last7Days = Array.from({ length: 7 }, (_, idx) => 6 - idx).map((i) => ({
    dayStart: startOfDay(subDays(new Date(), i)),
    dayEnd: startOfDay(subDays(new Date(), i - 1)),
  }));
  const revenueByDay = await Promise.all(
    last7Days.map(async ({ dayStart, dayEnd }) => {
      const bills = await prisma.bill.findMany({
        where: { clientId, createdAt: { gte: dayStart, lt: dayEnd } },
      });
      return {
        Date: format(dayStart, "yyyy-MM-dd"),
        Day: format(dayStart, "EEEE"),
        Revenue: bills.reduce((sum, b) => sum + Number(b.totalAmount), 0),
        Bills: bills.length,
      };
    }),
  );

  const recentItems = await prisma.orderItem.findMany({
    where: {
      order: { clientId, status: { not: "CANCELLED" }, createdAt: { gte: subDays(new Date(), 30) } },
    },
    include: { menuItem: true },
  });
  const salesByItem = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const item of recentItems) {
    const existing = salesByItem.get(item.menuItemId) ?? {
      name: item.menuItem.name,
      quantity: 0,
      revenue: 0,
    };
    existing.quantity += item.quantity;
    existing.revenue += Number(item.totalPrice);
    salesByItem.set(item.menuItemId, existing);
  }
  const topDishes = Array.from(salesByItem.values())
    .sort((a, b) => b.quantity - a.quantity)
    .map((dish) => ({ Dish: dish.name, "Quantity sold": dish.quantity, Revenue: dish.revenue }));

  const recentBills = await prisma.bill.findMany({
    where: { clientId, createdAt: { gte: subDays(new Date(), 30) } },
  });
  const revenue30d = recentBills.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const billedItems = await prisma.orderItem.findMany({
    where: { order: { clientId, bill: { createdAt: { gte: subDays(new Date(), 30) } } } },
    include: { menuItem: true },
  });
  const cogs30d = billedItems.reduce(
    (sum, item) => sum + Number(item.menuItem.costPrice) * item.quantity,
    0,
  );
  const profit30d = revenue30d - cogs30d;
  const marginPct = revenue30d > 0 ? (profit30d / revenue30d) * 100 : 0;

  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet([
    { Metric: "Today's sales", Value: todaysSales },
    { Metric: "Today's bills", Value: todaysBills.length },
    { Metric: "Pending payments", Value: pendingAmount },
    { Metric: "Orders with pending payment", Value: pendingOrders.length },
    { Metric: "Low stock ingredients", Value: lowStockIngredients.length },
    { Metric: "Revenue (30d)", Value: revenue30d },
    { Metric: "Cost of goods (30d)", Value: cogs30d },
    { Metric: "Net profit (30d)", Value: profit30d },
    { Metric: "Margin % (30d)", Value: Number(marginPct.toFixed(1)) },
  ]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(revenueByDay),
    "Revenue (7d)",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      topDishes.length > 0 ? topDishes : [{ Dish: "No sales recorded", "Quantity sold": 0, Revenue: 0 }],
    ),
    "Top dishes (30d)",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      lowStockIngredients.length > 0
        ? lowStockIngredients.map((i) => ({
            Ingredient: i.name,
            "In stock": Number(i.quantityInStock),
            "Reorder level": Number(i.reorderLevel),
            Unit: i.unit,
          }))
        : [{ Ingredient: "All ingredients well stocked" }],
    ),
    "Low stock",
  );

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="dashboard-${format(new Date(), "yyyy-MM-dd")}.xlsx"`,
    },
  });
}
