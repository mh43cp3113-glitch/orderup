import { prisma } from "@/lib/prisma";
import { requireCurrentClientContext } from "@/lib/current-client";
import { tablesLabel, tableLabelSingular, orderLabelSingular } from "@/lib/vertical";
import { AddTableDialog } from "./add-table-dialog";
import { TableCard } from "./table-card";

export default async function TablesPage() {
  const { clientId, businessType } = await requireCurrentClientContext();
  const tables = await prisma.restaurantTable.findMany({
    where: { clientId },
    orderBy: [{ floor: "asc" }, { name: "asc" }],
    include: {
      orders: {
        where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const floors = Array.from(new Set(tables.map((t) => t.floor)));
  const label = tablesLabel(businessType);
  const singularLabel = tableLabelSingular(businessType);
  const orderLabel = orderLabelSingular(businessType);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{label} Management</h1>
          <p className="text-sm text-muted-foreground">
            Live layout with occupancy status.
          </p>
        </div>
        <AddTableDialog label={singularLabel} />
      </div>

      {tables.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No {label.toLowerCase()} yet. Add one to get started.
        </p>
      )}

      {floors.map((floor) => (
        <div key={floor} className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">{floor}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {tables
              .filter((t) => t.floor === floor)
              .map((table) => (
                <TableCard
                  key={table.id}
                  table={{
                    id: table.id,
                    name: table.name,
                    floor: table.floor,
                    capacity: table.capacity,
                    status: table.status,
                    activeOrderId: table.orders[0]?.id,
                  }}
                  label={singularLabel}
                  orderLabel={orderLabel}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
