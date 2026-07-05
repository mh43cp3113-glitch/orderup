"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { createMenuItem, updateMenuItem } from "./actions";

type Category = { id: string; name: string };
type Variant = { name: string; price: number };

type MenuItemInput = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  costPrice: string;
  isSeasonal: boolean;
  variants: Variant[];
};

export function ItemDialog({
  categories,
  item,
}: {
  categories: Category[];
  item?: MenuItemInput;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [variants, setVariants] = useState<Variant[]>(
    item?.variants ?? [{ name: "Regular", price: 0 }],
  );

  const action = item ? updateMenuItem.bind(null, item.id) : createMenuItem;

  function addVariant() {
    setVariants((v) => [...v, { name: "", price: 0 }]);
  }

  function removeVariant(idx: number) {
    setVariants((v) => v.filter((_, i) => i !== idx));
  }

  function handleSubmit(formData: FormData) {
    formData.set("variants", JSON.stringify(variants));
    startTransition(async () => {
      const result = await action(undefined, formData);
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
          item ? (
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          )
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={item?.name} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={item?.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                name="categoryId"
                defaultValue={item?.categoryId}
                items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="costPrice">Cost price (₹)</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                step="0.01"
                defaultValue={item?.costPrice ?? "0"}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Pricing variants</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-3 w-3" /> Add variant
              </Button>
            </div>
            {variants.map((variant, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  placeholder="e.g. Small, Medium, Regular"
                  value={variant.name}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setVariants(next);
                  }}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  className="w-28"
                  value={variant.price}
                  onChange={(e) => {
                    const next = [...variants];
                    next[idx] = { ...next[idx], price: Number(e.target.value) };
                    setVariants(next);
                  }}
                />
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariant(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isSeasonal" defaultChecked={item?.isSeasonal} />
            Seasonal item
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : item ? "Save changes" : "Create item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
