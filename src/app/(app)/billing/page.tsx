import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";

export default async function BillingPage() {
  const clientId = await requireCurrentClientId();
  const bills = await prisma.bill.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { order: { include: { table: true, customer: true, payments: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Generated bills, tax breakdown and payment status.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Table / Customer</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment methods</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.billNumber}</TableCell>
                  <TableCell>
                    <Link href={`/orders/${bill.orderId}`} className="hover:underline">
                      {bill.order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {bill.order.table?.name ?? bill.order.customer?.name ?? "-"}
                  </TableCell>
                  <TableCell>{formatCurrency(bill.taxAmount.toString())}</TableCell>
                  <TableCell>
                    {Number(bill.discountAmount) > 0
                      ? formatCurrency(bill.discountAmount.toString())
                      : "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(bill.totalAmount.toString())}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {bill.order.payments.map((p) => (
                        <Badge key={p.id} variant="outline" className="capitalize">
                          {p.method.toLowerCase()}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(bill.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
              {bills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No bills generated yet.
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
