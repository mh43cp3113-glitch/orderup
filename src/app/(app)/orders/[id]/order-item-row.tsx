"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { removeOrderItem, updateKitchenStatus } from "../actions";
import { KitchenStatusBadge } from "../status-badge";
import type { KitchenStatus } from "@/generated/prisma/enums";

const KITCHEN_STATUSES: KitchenStatus[] = ["PENDING", "COOKING", "READY", "SERVED"];

export function OrderItemRow({
  item,
  editable,
}: {
  item: {
    id: string;
    menuItemName: string;
    variantName: string | null;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    notes: string | null;
    kitchenStatus: KitchenStatus;
  };
  editable: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{item.menuItemName}</p>
        {item.variantName && (
          <p className="text-xs text-muted-foreground">{item.variantName}</p>
        )}
        {item.notes && <p className="text-xs text-muted-foreground italic">{item.notes}</p>}
      </TableCell>
      <TableCell>{item.quantity}</TableCell>
      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
      <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" disabled={isPending}>
                <KitchenStatusBadge status={item.kitchenStatus} />
              </button>
            }
          />
          <DropdownMenuContent align="start">
            {KITCHEN_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() =>
                  startTransition(async () => {
                    await updateKitchenStatus(item.id, status);
                  })
                }
              >
                Mark as {status.toLowerCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
      {editable && (
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            onClick={() => startTransition(() => removeOrderItem(item.id))}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}
