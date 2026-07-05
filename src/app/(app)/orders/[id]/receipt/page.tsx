import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PrintButton } from "./print-button";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = await requireCurrentClientId();

  const order = await prisma.order.findFirst({
    where: { id, clientId },
    include: {
      table: true,
      customer: true,
      bill: true,
      payments: true,
      items: { include: { menuItem: true, variant: true } },
    },
  });

  if (!order) notFound();

  const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="max-w-md mx-auto flex flex-col gap-4 print:max-w-full">
      <div className="print:hidden">
        <PrintButton />
      </div>
      <div className="rounded-lg border bg-background p-6 font-mono text-sm">
        <div className="text-center mb-4">
          <p className="font-semibold text-base">Restaurant Manager</p>
          <p className="text-muted-foreground text-xs">Tax Invoice / Receipt</p>
        </div>
        <div className="flex justify-between text-xs mb-2">
          <span>Order: {order.orderNumber}</span>
          <span>{formatDateTime(order.createdAt)}</span>
        </div>
        {order.bill && <p className="text-xs mb-2">Bill No: {order.bill.billNumber}</p>}
        <p className="text-xs mb-2">
          {order.type.replace("_", " ")} &middot; {order.table?.name ?? order.customer?.name ?? "Walk-in"}
        </p>

        <div className="border-t border-dashed my-2" />

        <table className="w-full text-xs">
          <thead>
            <tr className="text-left">
              <th className="pb-1">Item</th>
              <th className="pb-1 text-center">Qty</th>
              <th className="pb-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-0.5">
                  {item.menuItem.name}
                  {item.variant ? ` (${item.variant.name})` : ""}
                </td>
                <td className="py-0.5 text-center">{item.quantity}</td>
                <td className="py-0.5 text-right">{formatCurrency(item.totalPrice.toString())}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed my-2" />

        <div className="flex flex-col gap-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal.toString())}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (GST)</span>
            <span>{formatCurrency(order.taxAmount.toString())}</span>
          </div>
          {Number(order.discountAmount) > 0 && (
            <div className="flex justify-between">
              <span>Discount{order.bill?.couponCode ? ` (${order.bill.couponCode})` : ""}</span>
              <span>-{formatCurrency(order.discountAmount.toString())}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t border-dashed pt-1 mt-1">
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount.toString())}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid</span>
            <span>{formatCurrency(totalPaid)}</span>
          </div>
        </div>

        <div className="border-t border-dashed my-2" />
        <p className="text-center text-xs text-muted-foreground">Thank you, visit again!</p>
      </div>
    </div>
  );
}
