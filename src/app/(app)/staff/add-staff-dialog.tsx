"use client";

import { useState, useTransition } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createStaff, updateStaff } from "./actions";
import { ROLE_ITEMS } from "./role-select-items";
import type { Role } from "@/generated/prisma/enums";

type StaffInput = {
  id: string;
  name: string;
  phone: string;
  role: Role;
  baseSalary: string;
};

export function StaffDialog({ staff }: { staff?: StaffInput }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const action = staff ? updateStaff.bind(null, staff.id) : createStaff;

  function handleSubmit(formData: FormData) {
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
          staff ? (
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add Staff
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{staff ? "Edit Staff" : "Add Staff"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={staff?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={staff?.phone} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" defaultValue={staff?.role ?? "WAITER"} items={ROLE_ITEMS}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_ITEMS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="baseSalary">Monthly base salary (₹)</Label>
            <Input
              id="baseSalary"
              name="baseSalary"
              type="number"
              step="0.01"
              defaultValue={staff?.baseSalary ?? "0"}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : staff ? "Save changes" : "Add staff"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
