import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { OrderStatusBadge, OrderSourceBadge } from "../status-badge";
import { StatusControls } from "./status-controls";
import { AddItemForm } from "./add-item-form";
import { OrderItemRow } from "./order-item-row";
import { CheckoutPanel } from "./checkout-panel";
import { Receipt } from "lucide-react";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user;
  if (!user || user.isSuperAdmin || !user.clientId || !user.role) notFound();
  const role = user.role;
  const clientId = user.clientId;

  const order = await prisma.order.findFirst({
    where: { id, clientId },
    include: {
      table: true,
      customer: true,
      waiter: true,
      bill: true,
      payments: { orderBy: { paidAt: "desc" } },
      items: {
        orderBy: { createdAt: "asc" },
        include: { menuItem: true, variant: true },
      },
    },
  });

  if (!order) notFound();

  const categories = await prisma.menuCategory.findMany({
    where: { clientId, items: { some: { isAvailable: true } } },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { name: "asc" },
        include: { variants: { orderBy: { price: "asc" } } },
      },
    },
  });

  const canEditItems =
    order.status !== "COMPLETED" &&
    order.status !== "CANCELLED" &&
    ["ADMIN", "MANAGER", "CASHIER", "WAITER"].includes(role);

  const canBill =
    order.status !== "CANCELLED" &&
    order.status !== "COMPLETED" &&
    ["ADMIN", "MANAGER", "CASHIER"].includes(role);

  const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.type.replace("_", " ")} &middot; {order.table?.name ?? order.customer?.name ?? "Walk-in"}
            {" "}&middot; Placed {formatDateTime(order.createdAt)}
            {order.waiter && <> &middot; Waiter: {order.waiter.name}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <OrderSourceBadge source={order.source} />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link href={`/orders/${order.id}/receipt`}>
                <Receipt className="h-4 w-4" /> Receipt
              </Link>
            }
          />
          <StatusControls orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Kitchen status</TableHead>
                  {canEditItems && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <OrderItemRow
                    key={item.id}
                    editable={canEditItems}
                    item={{
                      id: item.id,
                      menuItemName: item.menuItem.name,
                      variantName: item.variant?.name ?? null,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice.toString(),
                      totalPrice: item.totalPrice.toString(),
                      notes: item.notes,
                      kitchenStatus: item.kitchenStatus,
                    }}
                  />
                ))}
                {order.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8 text-sm"
                    >
                      No items added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {canEditItems && (
            <Card>
              <CardHeader>
                <CardTitle>Add item</CardTitle>
              </CardHeader>
              <CardContent>
                <AddItemForm
                  orderId={order.id}
                  categories={categories.map((c) => ({
                    id: c.id,
                    name: c.name,
                    items: c.items.map((item) => ({
                      id: item.id,
                      name: item.name,
                      variants: item.variants.map((v) => ({
                        id: v.id,
                        name: v.name,
                        price: Number(v.price),
                      })),
                    })),
                  }))}
                />
              </CardContent>
            </Card>
          )}

          {canBill && order.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Billing &amp; payment</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckoutPanel
                  orderId={order.id}
                  subtotal={order.subtotal.toString()}
                  taxAmount={order.taxAmount.toString()}
                  discountAmount={order.discountAmount.toString()}
                  totalAmount={order.totalAmount.toString()}
                  totalPaid={totalPaid}
                  hasBill={Boolean(order.bill)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
