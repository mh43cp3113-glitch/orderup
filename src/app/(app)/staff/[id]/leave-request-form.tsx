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
import { requestLeave } from "../actions";

const LEAVE_TYPE_ITEMS = { SICK: "Sick leave", CASUAL: "Casual leave", UNPAID: "Unpaid leave" };

export function LeaveRequestForm({ staffId }: { staffId: string }) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const action = requestLeave.bind(null, staffId);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await action(undefined, formData);
      setError(result);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">Type</Label>
        <Select name="type" defaultValue="CASUAL" items={LEAVE_TYPE_ITEMS}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LEAVE_TYPE_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Input id="reason" name="reason" placeholder="e.g. family function" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Request leave"}
      </Button>
    </form>
  );
}
