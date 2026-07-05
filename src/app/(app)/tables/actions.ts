"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import type { TableStatus } from "@/generated/prisma/enums";

export async function createTable(_prev: string | undefined, formData: FormData) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);

  const name = (formData.get("name") as string)?.trim();
  const floor = (formData.get("floor") as string)?.trim() || "Floor 1";
  const capacity = Number(formData.get("capacity")) || 2;

  if (!name) return "Table name is required";

  const existing = await prisma.restaurantTable.findUnique({
    where: { clientId_name: { clientId, name } },
  });
  if (existing) return `Table "${name}" already exists`;

  await prisma.restaurantTable.create({ data: { name, floor, capacity, clientId } });
  revalidatePath("/tables");
  return undefined;
}

export async function updateTableStatus(tableId: string, status: TableStatus) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER", "WAITER", "CASHIER"]);
  await prisma.restaurantTable.updateMany({ where: { id: tableId, clientId }, data: { status } });
  revalidatePath("/tables");
}

export async function deleteTable(tableId: string) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);
  await prisma.restaurantTable.deleteMany({ where: { id: tableId, clientId } });
  revalidatePath("/tables");
}
