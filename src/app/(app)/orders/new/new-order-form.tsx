"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrder } from "../actions";
import { isBookingVertical, orderLabelSingular, tableLabelSingular } from "@/lib/vertical";
import type { OrderType, BusinessType } from "@/generated/prisma/enums";

type TableOption = { id: string; name: string; floor: string };

export function NewOrderForm({
  tables,
  defaultTableId,
  businessType,
}: {
  tables: TableOption[];
  defaultTableId?: string;
  businessType: BusinessType;
}) {
  const [type, setType] = useState<OrderType>(defaultTableId ? "DINE_IN" : "DINE_IN");
  const isBooking = isBookingVertical(businessType);
  const tableLabel = tableLabelSingular(businessType);

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>New {orderLabelSingular(businessType)}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createOrder} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">{orderLabelSingular(businessType)} type</Label>
            <Select
              name="type"
              value={type}
              onValueChange={(v) => v && setType(v as OrderType)}
              items={{
                DINE_IN: isBooking ? "Room stay" : "Dine-in",
                TAKEAWAY: "Takeaway",
                DELIVERY: "Delivery",
              }}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DINE_IN">{isBooking ? "Room stay" : "Dine-in"}</SelectItem>
                <SelectItem value="TAKEAWAY">Takeaway</SelectItem>
                <SelectItem value="DELIVERY">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "DINE_IN" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="tableId">{tableLabel}</Label>
              <Select
                name="tableId"
                defaultValue={defaultTableId}
                items={Object.fromEntries(tables.map((t) => [t.id, `${t.name} (${t.floor})`]))}
              >
                <SelectTrigger id="tableId">
                  <SelectValue placeholder={`Select an available ${tableLabel.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.floor})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tables.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No available {tableLabel.toLowerCase()}s right now.
                </p>
              )}
            </div>
          )}

          {type === "DINE_IN" && isBooking && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkInDate">Check-in date</Label>
                <Input id="checkInDate" name="checkInDate" type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="checkOutDate">Check-out date</Label>
                <Input id="checkOutDate" name="checkOutDate" type="date" />
              </div>
              <div className="flex flex-col gap-2 col-span-2">
                <Label htmlFor="guestCount">Guests</Label>
                <Input id="guestCount" name="guestCount" type="number" min={1} placeholder="2" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="customerName">Customer name (optional)</Label>
              <Input id="customerName" name="customerName" placeholder="Rahul Sharma" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="customerPhone">Phone (optional)</Label>
              <Input id="customerPhone" name="customerPhone" placeholder="9876543210" />
            </div>
          </div>

          <Button type="submit">Start {orderLabelSingular(businessType).toLowerCase()}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
