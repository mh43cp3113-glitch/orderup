"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
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
import { Trash2 } from "lucide-react";
import { toggleAvailability, deleteMenuItem } from "./actions";

export function AvailabilityToggle({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isAvailable}
      disabled={isPending}
      onCheckedChange={(checked) => startTransition(() => toggleAvailability(itemId, checked))}
    />
  );
}

export function DeleteItemButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon" disabled={isPending}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{itemName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the item and its pricing variants. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => startTransition(() => deleteMenuItem(itemId))}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
