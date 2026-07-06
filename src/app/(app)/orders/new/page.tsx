import { prisma } from "@/lib/prisma";
import { requireCurrentClientContext } from "@/lib/current-client";
import { orderLabelSingular } from "@/lib/vertical";
import { NewOrderForm } from "./new-order-form";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ tableId?: string }>;
}) {
  const { tableId } = await searchParams;
  const { clientId, businessType } = await requireCurrentClientContext();

  const tables = await prisma.restaurantTable.findMany({
    where: { clientId, status: "AVAILABLE" },
    orderBy: { name: "asc" },
  });

  const label = orderLabelSingular(businessType);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">New {label}</h1>
        <p className="text-sm text-muted-foreground">
          Choose the {label.toLowerCase()} type and start adding items.
        </p>
      </div>
      <NewOrderForm tables={tables} defaultTableId={tableId} businessType={businessType} />
    </div>
  );
}
