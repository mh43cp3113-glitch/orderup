import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";
import { NewOrderForm } from "./new-order-form";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ tableId?: string }>;
}) {
  const { tableId } = await searchParams;
  const clientId = await requireCurrentClientId();

  const tables = await prisma.restaurantTable.findMany({
    where: { clientId, status: "AVAILABLE" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">New Order</h1>
        <p className="text-sm text-muted-foreground">
          Choose the order type and start adding items.
        </p>
      </div>
      <NewOrderForm tables={tables} defaultTableId={tableId} />
    </div>
  );
}
