"use client";

import { useActionState, useMemo, useState } from "react";
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
import { addOrderItem } from "../actions";

type Variant = { id: string; name: string; price: number };
type MenuItem = { id: string; name: string; variants: Variant[] };
type Category = { id: string; name: string; items: MenuItem[] };

export function AddItemForm({ orderId, categories }: { orderId: string; categories: Category[] }) {
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [menuItemId, setMenuItemId] = useState<string>("");
  const [variantId, setVariantId] = useState<string>("");

  const action = addOrderItem.bind(null, orderId);
  const [error, formAction, isPending] = useActionState(action, undefined);

  const items = useMemo(
    () => categories.find((c) => c.id === categoryId)?.items ?? [],
    [categories, categoryId],
  );
  const variants = useMemo(
    () => items.find((i) => i.id === menuItemId)?.variants ?? [],
    [items, menuItemId],
  );

  function handleCategoryChange(value: string | null) {
    if (!value) return;
    setCategoryId(value);
    setMenuItemId("");
    setVariantId("");
  }

  function handleItemChange(value: string | null) {
    if (!value) return;
    setMenuItemId(value);
    const nextVariants = items.find((i) => i.id === value)?.variants ?? [];
    setVariantId(nextVariants[0]?.id ?? "");
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select
            value={categoryId}
            onValueChange={handleCategoryChange}
            items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
          >
            <SelectTrigger>
              <SelectValue />
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
        <div className="flex flex-col gap-1.5">
          <Label>Item</Label>
          <Select
            value={menuItemId}
            onValueChange={handleItemChange}
            items={Object.fromEntries(items.map((i) => [i.id, i.name]))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
              {items.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No available items
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Variant</Label>
          <Select
            value={variantId}
            onValueChange={(v) => v && setVariantId(v)}
            name="variantId"
            items={Object.fromEntries(variants.map((v) => [v.id, `${v.name} - ₹${v.price}`]))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent>
              {variants.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} - ₹{v.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} />
        </div>
      </div>

      <input type="hidden" name="menuItemId" value={menuItemId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" name="notes" placeholder="e.g. no onions" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending || !menuItemId || !variantId}>
        {isPending ? "Adding..." : "Add to order"}
      </Button>
    </form>
  );
}
