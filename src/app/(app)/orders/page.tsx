import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentClientContext } from "@/lib/current-client";
import { ordersLabel, orderLabelSingular, tableLabelSingular } from "@/lib/vertical";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { OrderStatusBadge, OrderSourceBadge } from "./status-badge";
import { Plus } from "lucide-react";

export default async function OrdersPage() {
  const { clientId, businessType } = await requireCurrentClientContext();
  const orders = await prisma.order.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { table: true, customer: true, items: true },
  });

  const label = ordersLabel(businessType);
  const tableLabel = tableLabelSingular(businessType);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{label}</h1>
          <p className="text-sm text-muted-foreground">
            All {label.toLowerCase()} across the business.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/orders/new">
              <Plus className="h-4 w-4" /> New {orderLabelSingular(businessType)}
            </Link>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{orderLabelSingular(businessType)} #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>{tableLabel} / Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placed at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{order.type.toLowerCase().replace("_", " ")}</TableCell>
                  <TableCell>{order.table?.name ?? order.customer?.name ?? "-"}</TableCell>
                  <TableCell>{order.items.length}</TableCell>
                  <TableCell>{formatCurrency(order.totalAmount.toString())}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <OrderStatusBadge status={order.status} />
                      <OrderSourceBadge source={order.source} />
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No {label.toLowerCase()} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
