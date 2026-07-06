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
import { createTable } from "./actions";

export function AddTableDialog({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTable(undefined, formData);
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
            <Plus className="h-4 w-4" /> Add {label}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {label}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{label} name</Label>
            <Input id="name" name="name" required placeholder="e.g. T7" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="floor">Floor</Label>
              <Input id="floor" name="floor" defaultValue="Floor 1" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" name="capacity" type="number" defaultValue={4} min={1} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : `Add ${label.toLowerCase()}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
