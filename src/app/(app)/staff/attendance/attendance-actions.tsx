"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { clockIn, clockOut, markAbsent } from "../actions";

export function AttendanceActions({
  staffId,
  hasClockIn,
  hasClockOut,
}: {
  staffId: string;
  hasClockIn: boolean;
  hasClockOut: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        variant={hasClockIn ? "outline" : "default"}
        disabled={isPending || hasClockIn}
        onClick={() => startTransition(() => clockIn(staffId))}
      >
        Clock in
      </Button>
      <Button
        size="sm"
        variant={hasClockOut ? "outline" : "default"}
        disabled={isPending || !hasClockIn || hasClockOut}
        onClick={() => startTransition(() => clockOut(staffId))}
      >
        Clock out
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => startTransition(() => markAbsent(staffId))}
      >
        Mark absent
      </Button>
    </div>
  );
}
