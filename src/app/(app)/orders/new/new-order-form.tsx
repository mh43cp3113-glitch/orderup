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
import type { OrderType } from "@/generated/prisma/enums";

type TableOption = { id: string; name: string; floor: string };

export function NewOrderForm({
  tables,
  defaultTableId,
}: {
  tables: TableOption[];
  defaultTableId?: string;
}) {
  const [type, setType] = useState<OrderType>(defaultTableId ? "DINE_IN" : "DINE_IN");

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>New Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createOrder} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Order type</Label>
            <Select
              name="type"
              value={type}
              onValueChange={(v) => v && setType(v as OrderType)}
              items={{ DINE_IN: "Dine-in", TAKEAWAY: "Takeaway", DELIVERY: "Delivery" }}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DINE_IN">Dine-in</SelectItem>
                <SelectItem value="TAKEAWAY">Takeaway</SelectItem>
                <SelectItem value="DELIVERY">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "DINE_IN" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="tableId">Table</Label>
              <Select
                name="tableId"
                defaultValue={defaultTableId}
                items={Object.fromEntries(tables.map((t) => [t.id, `${t.name} (${t.floor})`]))}
              >
                <SelectTrigger id="tableId">
                  <SelectValue placeholder="Select an available table" />
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
                <p className="text-xs text-muted-foreground">No available tables right now.</p>
              )}
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

          <Button type="submit">Start order</Button>
        </form>
      </CardContent>
    </Card>
  );
}
