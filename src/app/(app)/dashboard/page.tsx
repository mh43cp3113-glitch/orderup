import { startOfDay, subDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { StatTile } from "./stat-tile";
import { RevenueChart } from "./revenue-chart";
import {
  IndianRupee,
  ClipboardList,
  Users,
  Wallet,
  PackageX,
  TrendingUp,
} from "lucide-react";

export default async function DashboardPage() {
  const clientId = await requireCurrentClientId();
  const today = startOfDay(new Date());

  const [todaysBills, activeOrdersCount, totalCustomers, ingredients, allOrders] =
    await Promise.all([
      prisma.bill.findMany({ where: { clientId, createdAt: { gte: today } } }),
      prisma.order.count({
        where: { clientId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      }),
      prisma.customer.count({ where: { clientId } }),
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

  // Revenue for the last 7 days
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
        label: format(dayStart, "EEE"),
        revenue: bills.reduce((sum, b) => sum + Number(b.totalAmount), 0),
      };
    }),
  );

  // Top selling dishes (last 30 days)
  const recentItems = await prisma.orderItem.findMany({
    where: {
      order: {
        clientId,
        status: { not: "CANCELLED" },
        createdAt: { gte: subDays(new Date(), 30) },
      },
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
    .slice(0, 5);

  // Profit summary (last 30 days): revenue from bills minus ingredient/cost-price COGS.
  // COGS is scoped to the same billed orders as revenue, so unpaid/in-progress orders
  // (which have consumed stock but not yet been billed) don't skew the margin.
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of today&apos;s operations.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatTile
          label="Today's sales"
          value={formatCurrency(todaysSales)}
          icon={IndianRupee}
          hint={`${todaysBills.length} bill${todaysBills.length === 1 ? "" : "s"} today`}
        />
        <StatTile label="Active orders" value={String(activeOrdersCount)} icon={ClipboardList} />
        <StatTile label="Total customers" value={String(totalCustomers)} icon={Users} />
        <StatTile
          label="Pending payments"
          value={formatCurrency(pendingAmount)}
          icon={Wallet}
          hint={`${pendingOrders.length} order${pendingOrders.length === 1 ? "" : "s"} due`}
          tone={pendingOrders.length > 0 ? "warning" : "default"}
        />
        <StatTile
          label="Low stock alerts"
          value={String(lowStockIngredients.length)}
          icon={PackageX}
          tone={lowStockIngredients.length > 0 ? "critical" : "default"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueByDay} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Profit summary (30d)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Revenue</span>
              <span>{formatCurrency(revenue30d)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost of goods</span>
              <span>{formatCurrency(cogs30d)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2 mt-1">
              <span>Net profit</span>
              <span>{formatCurrency(profit30d)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Margin</span>
              <span>{marginPct.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top selling dishes (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {topDishes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {topDishes.map((dish, idx) => (
                  <div key={dish.name} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm w-4">{idx + 1}</span>
                      <span className="font-medium">{dish.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">{dish.quantity} sold</span>
                      <span className="font-medium">{formatCurrency(dish.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockIngredients.length === 0 ? (
              <p className="text-sm text-muted-foreground">All ingredients are well stocked.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {lowStockIngredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex items-center justify-between py-2">
                    <span className="font-medium">{ingredient.name}</span>
                    <Badge variant="destructive">
                      {Number(ingredient.quantityInStock).toFixed(1)} / {Number(ingredient.reorderLevel).toFixed(1)}{" "}
                      {ingredient.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
