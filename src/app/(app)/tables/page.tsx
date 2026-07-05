import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";
import { AddTableDialog } from "./add-table-dialog";
import { TableCard } from "./table-card";

export default async function TablesPage() {
  const clientId = await requireCurrentClientId();
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Table Management</h1>
          <p className="text-sm text-muted-foreground">
            Live floor layout with occupancy status.
          </p>
        </div>
        <AddTableDialog />
      </div>

      {tables.length === 0 && (
        <p className="text-sm text-muted-foreground">No tables yet. Add one to get started.</p>
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
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
