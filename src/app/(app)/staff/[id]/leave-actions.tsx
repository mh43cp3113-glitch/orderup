"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { decideLeave } from "../actions";

export function LeaveDecisionButtons({ leaveId }: { leaveId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => startTransition(() => decideLeave(leaveId, "APPROVED"))}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => startTransition(() => decideLeave(leaveId, "REJECTED"))}
      >
        Reject
      </Button>
    </div>
  );
}
