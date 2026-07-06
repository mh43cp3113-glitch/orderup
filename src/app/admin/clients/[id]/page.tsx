import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientBranding } from "@/components/client-branding";
import { BUSINESS_TYPE_ITEMS } from "../business-type-items";
import { BILLING_CYCLE_ITEMS } from "../billing-cycle-items";
import { EditClientForm } from "./edit-client-form";
import { ClientStatusToggle } from "./client-status-toggle";
import { WebhookSecretsPanel } from "./webhook-secrets-panel";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: { users: { orderBy: { createdAt: "asc" } } },
  });

  if (!client) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ClientBranding name={client.name} logoUrl={client.logoUrl} className="text-xl" />
          <Badge variant="outline">{BUSINESS_TYPE_ITEMS[client.businessType]}</Badge>
          <Badge variant="secondary">{BILLING_CYCLE_ITEMS[client.billingCycle]}</Badge>
        </div>
        <ClientStatusToggle clientId={client.id} isActive={client.isActive} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
          </CardHeader>
          <CardContent>
            <EditClientForm
              clientId={client.id}
              name={client.name}
              businessType={client.businessType}
              billingCycle={client.billingCycle}
              gstEnabled={client.gstEnabled}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>External order webhook secrets</CardTitle>
          </CardHeader>
          <CardContent>
            <WebhookSecretsPanel
              clientId={client.id}
              secrets={{
                swiggy: client.swiggyWebhookSecret,
                zomato: client.zomatoWebhookSecret,
                website: client.websiteWebhookSecret,
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({client.users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {client.users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="flex flex-col divide-y">
              {client.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {user.role?.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
