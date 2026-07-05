"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { regenerateWebhookSecret } from "../actions";

const SOURCES = [
  { key: "swiggy" as const, label: "Swiggy" },
  { key: "zomato" as const, label: "Zomato" },
  { key: "website" as const, label: "Website / QR" },
];

export function WebhookSecretsPanel({
  clientId,
  secrets,
}: {
  clientId: string;
  secrets: { swiggy: string; zomato: string; website: string };
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {SOURCES.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{label}</p>
            <code className="text-xs text-muted-foreground break-all">{secrets[key]}</code>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => regenerateWebhookSecret(clientId, key))}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Regenerate
          </Button>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Send this value in the <code>x-webhook-secret</code> header when posting to{" "}
        <code>/api/webhooks/external-orders/&lt;source&gt;</code>.
      </p>
    </div>
  );
}
