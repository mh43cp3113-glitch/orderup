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
import { Plus } from "lucide-react";
import { createIngredient } from "./actions";

export function AddIngredientDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createIngredient(undefined, formData);
      if (result) {
        setError(result);
      } else {
        setError(undefined);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add Ingredient
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Ingredient</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Tomato" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" required placeholder="kg, g, l, pcs" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantityInStock">Opening stock</Label>
              <Input id="quantityInStock" name="quantityInStock" type="number" step="0.01" defaultValue={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reorderLevel">Reorder level</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" step="0.01" defaultValue={0} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="costPerUnit">Cost per unit (₹)</Label>
              <Input id="costPerUnit" name="costPerUnit" type="number" step="0.01" defaultValue={0} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Add ingredient"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
