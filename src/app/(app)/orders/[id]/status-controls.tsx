"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateOrderStatus, cancelOrder } from "../actions";
import type { OrderStatus } from "@/generated/prisma/enums";

const FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED"];

export function StatusControls({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [isPending, startTransition] = useTransition();
  const currentIdx = FLOW.indexOf(status);
  const nextStatus = currentIdx >= 0 && currentIdx < FLOW.length - 1 ? FLOW[currentIdx + 1] : null;

  const isFinal = status === "COMPLETED" || status === "CANCELLED";

  return (
    <div className="flex items-center gap-2">
      {nextStatus && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => updateOrderStatus(orderId, nextStatus))}
        >
          Mark as {nextStatus.toLowerCase()}
        </Button>
      )}
      {!isFinal && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button size="sm" variant="outline" disabled={isPending}>
                Cancel order
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
              <AlertDialogDescription>
                Ingredient stock for all items will be restored and the table will be freed for
                cleaning. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep order</AlertDialogCancel>
              <AlertDialogAction onClick={() => startTransition(() => cancelOrder(orderId))}>
                Cancel order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
