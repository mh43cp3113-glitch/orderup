"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const variantSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),
});

const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  costPrice: z.coerce.number().min(0).default(0),
  isSeasonal: z.coerce.boolean().default(false),
  weightValue: z.coerce.number().positive().optional(),
  weightUnit: z.enum(["GRAM", "KILOGRAM"]).optional(),
  flavor: z.string().optional(),
  isEggless: z.coerce.boolean().default(false),
  variants: z.array(variantSchema).min(1, "At least one price variant is required"),
});

export async function createCategory(_prev: string | undefined, formData: FormData) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);
  const name = formData.get("name") as string;
  if (!name?.trim()) return "Category name is required";

  await prisma.menuCategory.create({ data: { name: name.trim(), clientId } });
  revalidatePath("/menu");
  return undefined;
}

export async function deleteCategory(categoryId: string) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);
  await prisma.menuCategory.deleteMany({ where: { id: categoryId, clientId } });
  revalidatePath("/menu");
}

export async function createMenuItem(_prev: string | undefined, formData: FormData) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
    costPrice: formData.get("costPrice"),
    isSeasonal: formData.get("isSeasonal") === "on",
    weightValue: formData.get("weightValue") || undefined,
    weightUnit: formData.get("weightUnit") || undefined,
    flavor: formData.get("flavor") || undefined,
    isEggless: formData.get("isEggless") === "on",
    variants: JSON.parse((formData.get("variants") as string) || "[]"),
  };

  const parsed = menuItemSchema.safeParse(raw);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { variants, ...item } = parsed.data;

  const category = await prisma.menuCategory.findFirst({
    where: { id: item.categoryId, clientId },
  });
  if (!category) return "Invalid category";

  await prisma.menuItem.create({
    data: {
      ...item,
      clientId,
      variants: {
        create: variants.map((v, idx) => ({
          name: v.name,
          price: v.price,
          isDefault: idx === 0,
        })),
      },
    },
  });

  revalidatePath("/menu");
  return undefined;
}

export async function updateMenuItem(
  itemId: string,
  _prev: string | undefined,
  formData: FormData,
) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
    costPrice: formData.get("costPrice"),
    isSeasonal: formData.get("isSeasonal") === "on",
    weightValue: formData.get("weightValue") || undefined,
    weightUnit: formData.get("weightUnit") || undefined,
    flavor: formData.get("flavor") || undefined,
    isEggless: formData.get("isEggless") === "on",
    variants: JSON.parse((formData.get("variants") as string) || "[]"),
  };

  const parsed = menuItemSchema.safeParse(raw);
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { variants, ...item } = parsed.data;

  const category = await prisma.menuCategory.findFirst({
    where: { id: item.categoryId, clientId },
  });
  if (!category) return "Invalid category";

  const existing = await prisma.menuItem.findFirst({ where: { id: itemId, clientId } });
  if (!existing) return "Item not found";

  await prisma.$transaction([
    prisma.menuItem.update({ where: { id: itemId }, data: item }),
    prisma.menuItemVariant.deleteMany({ where: { menuItemId: itemId } }),
    prisma.menuItemVariant.createMany({
      data: variants.map((v, idx) => ({
        menuItemId: itemId,
        name: v.name,
        price: v.price,
        isDefault: idx === 0,
      })),
    }),
  ]);

  revalidatePath("/menu");
  return undefined;
}

export async function toggleAvailability(itemId: string, isAvailable: boolean) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);
  await prisma.menuItem.updateMany({ where: { id: itemId, clientId }, data: { isAvailable } });
  revalidatePath("/menu");
}

export async function deleteMenuItem(itemId: string) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);
  await prisma.menuItem.deleteMany({ where: { id: itemId, clientId } });
  revalidatePath("/menu");
}
