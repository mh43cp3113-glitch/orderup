"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";
import { recordPayment } from "../../billing/actions";
import type { PaymentMethod } from "@/generated/prisma/enums";

export function CheckoutPanel({
  orderId,
  subtotal,
  taxAmount,
  discountAmount,
  totalAmount,
  totalPaid,
  hasBill,
}: {
  orderId: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  totalPaid: number;
  hasBill: boolean;
}) {
  const action = recordPayment.bind(null, orderId);
  const [error, formAction, isPending] = useActionState(action, undefined);
  const [method, setMethod] = useState<PaymentMethod>("CASH");

  const due = Math.max(Number(totalAmount) - totalPaid, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax (GST)</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
        {Number(discountAmount) > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <Separator className="my-1" />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
        {totalPaid > 0 && (
          <>
            <div className="flex justify-between text-muted-foreground">
              <span>Paid</span>
              <span>{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Due</span>
              <span>{formatCurrency(due)}</span>
            </div>
          </>
        )}
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        {!hasBill && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="couponCode">Coupon code (optional)</Label>
            <Input id="couponCode" name="couponCode" placeholder="e.g. WELCOME10" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Payment method</Label>
            <Select
              value={method}
              onValueChange={(v) => v && setMethod(v as PaymentMethod)}
              name="method"
              items={{ CASH: "Cash", CARD: "Card", UPI: "UPI", WALLET: "Wallet" }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="WALLET">Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Amount received</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              defaultValue={due > 0 ? due : Number(totalAmount)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Processing..." : "Record payment"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Partial payments are supported — the order completes once the full amount is
          collected.
        </p>
      </form>
    </div>
  );
}
