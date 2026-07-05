"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Trash2, PackagePlus } from "lucide-react";
import { adjustStock, deleteIngredient, updateIngredient } from "./actions";

export function AdjustStockDialog({ ingredientId, unit }: { ingredientId: string; unit: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await adjustStock(ingredientId, formData);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <PackagePlus className="h-3.5 w-3.5" /> Adjust stock
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="direction">Type</Label>
            <Select
              name="direction"
              defaultValue="add"
              items={{
                add: "Add stock (purchase received)",
                remove: "Remove stock (waste / correction)",
              }}
            >
              <SelectTrigger id="direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add stock (purchase received)</SelectItem>
                <SelectItem value="remove">Remove stock (waste / correction)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="quantity">Quantity ({unit})</Label>
            <Input id="quantity" name="quantity" type="number" step="0.01" min={0} required />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Apply adjustment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditIngredientDialog({
  ingredientId,
  reorderLevel,
  costPerUnit,
}: {
  ingredientId: string;
  reorderLevel: string;
  costPerUnit: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateIngredient(ingredientId, formData);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm">Edit</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit ingredient</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reorderLevel">Reorder level</Label>
            <Input
              id="reorderLevel"
              name="reorderLevel"
              type="number"
              step="0.01"
              defaultValue={reorderLevel}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="costPerUnit">Cost per unit (₹)</Label>
            <Input
              id="costPerUnit"
              name="costPerUnit"
              type="number"
              step="0.01"
              defaultValue={costPerUnit}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteIngredientButton({ ingredientId, name }: { ingredientId: string; name: string }) {
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
          <AlertDialogTitle>Delete &quot;{name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. Make sure this ingredient isn&apos;t used in any recipe.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => startTransition(() => deleteIngredient(ingredientId))}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
