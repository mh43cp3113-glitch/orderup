"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, MoreVertical } from "lucide-react";
import { updateTableStatus, deleteTable } from "./actions";
import type { TableStatus } from "@/generated/prisma/enums";

const STATUS_STYLES: Record<TableStatus, string> = {
  AVAILABLE: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  OCCUPIED: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  RESERVED: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  CLEANING: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
};

const STATUS_OPTIONS: TableStatus[] = ["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"];

export function TableCard({
  table,
  label,
  orderLabel,
}: {
  table: { id: string; name: string; floor: string; capacity: number; status: TableStatus; activeOrderId?: string };
  label: string;
  orderLabel: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: TableStatus) {
    startTransition(async () => {
      await updateTableStatus(table.id, status);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTable(table.id);
      } catch {
        toast.error(`Cannot delete a ${label.toLowerCase()} with existing ${orderLabel.toLowerCase()}s`);
      }
    });
  }

  return (
    <Card className={`border ${STATUS_STYLES[table.status]}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{table.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isPending}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.filter((s) => s !== table.status).map((status) => (
                <DropdownMenuItem key={status} onClick={() => handleStatusChange(status)}>
                  Mark as {status.toLowerCase()}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                Delete {label.toLowerCase()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {table.capacity} {label === "Room" ? "guests" : "seats"}
          </span>
          <Badge variant="outline" className="capitalize">
            {table.status.toLowerCase()}
          </Badge>
        </div>
        {table.status === "AVAILABLE" && (
          <Button
            size="sm"
            className="w-full"
            nativeButton={false}
            render={<Link href={`/orders/new?tableId=${table.id}`}>Start {orderLabel}</Link>}
          />
        )}
        {table.status === "OCCUPIED" && table.activeOrderId && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            nativeButton={false}
            render={<Link href={`/orders/${table.activeOrderId}`}>View {orderLabel}</Link>}
          />
        )}
      </CardContent>
    </Card>
  );
}
