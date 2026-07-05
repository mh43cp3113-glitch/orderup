"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleClientActive } from "../actions";

export function ClientStatusToggle({ clientId, isActive }: { clientId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isActive}
        disabled={isPending}
        onCheckedChange={(checked) => startTransition(() => toggleClientActive(clientId, checked))}
      />
      <span className="text-sm text-muted-foreground">{isActive ? "Active" : "Suspended"}</span>
    </div>
  );
}
