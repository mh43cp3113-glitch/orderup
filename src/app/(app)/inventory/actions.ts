"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function createIngredient(_prev: string | undefined, formData: FormData) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);

  const name = (formData.get("name") as string)?.trim();
  const unit = (formData.get("unit") as string)?.trim();
  const quantityInStock = Number(formData.get("quantityInStock")) || 0;
  const reorderLevel = Number(formData.get("reorderLevel")) || 0;
  const costPerUnit = Number(formData.get("costPerUnit")) || 0;

  if (!name || !unit) return "Name and unit are required";

  await prisma.ingredient.create({
    data: { name, unit, quantityInStock, reorderLevel, costPerUnit, clientId },
  });

  revalidatePath("/inventory");
  return undefined;
}

export async function adjustStock(ingredientId: string, formData: FormData) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);

  const direction = formData.get("direction") as "add" | "remove";
  const quantity = Number(formData.get("quantity"));

  if (!quantity || quantity <= 0) return;

  await prisma.ingredient.updateMany({
    where: { id: ingredientId, clientId },
    data: {
      quantityInStock: direction === "add" ? { increment: quantity } : { decrement: quantity },
    },
  });

  revalidatePath("/inventory");
}

export async function updateIngredient(ingredientId: string, formData: FormData) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);

  const reorderLevel = Number(formData.get("reorderLevel")) || 0;
  const costPerUnit = Number(formData.get("costPerUnit")) || 0;

  await prisma.ingredient.updateMany({
    where: { id: ingredientId, clientId },
    data: { reorderLevel, costPerUnit },
  });

  revalidatePath("/inventory");
}

export async function deleteIngredient(ingredientId: string) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);
  await prisma.ingredient.deleteMany({ where: { id: ingredientId, clientId } });
  revalidatePath("/inventory");
}
