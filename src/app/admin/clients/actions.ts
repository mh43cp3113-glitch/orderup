"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/rbac";
import { saveLogoFile } from "@/lib/logo-upload";
import { slugify } from "@/lib/slug";
import type { BusinessType, BillingCycle } from "@/generated/prisma/enums";

const createClientSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  businessType: z.enum([
    "RESTAURANT",
    "CAFE",
    "CAKE_BAKERY",
    "CLOUD_KITCHEN",
    "BAR_PUB",
    "FOOD_TRUCK",
    "RESORT",
    "FARMHOUSE",
  ]),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Enter a valid email"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
});

async function uniqueSlug(base: string): Promise<string> {
  const baseSlug = slugify(base) || "business";
  let candidate = baseSlug;
  let n = 1;
  while (await prisma.client.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${baseSlug}-${n}`;
  }
  return candidate;
}

export async function createClient(_prev: string | undefined, formData: FormData) {
  await requireSuperAdmin();

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    businessType: formData.get("businessType"),
    billingCycle: formData.get("billingCycle") || undefined,
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  const { name, businessType, billingCycle, adminName, adminEmail, adminPassword } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingUser) return `A user with email ${adminEmail} already exists`;

  const slug = await uniqueSlug(name);

  let logoUrl: string | undefined;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logoUrl = await saveLogoFile(logoFile, slug);
    } catch (error) {
      return error instanceof Error ? error.message : "Failed to upload logo";
    }
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const client = await prisma.client.create({
    data: {
      name,
      slug,
      businessType: businessType as BusinessType,
      billingCycle: billingCycle as BillingCycle,
      logoUrl,
      users: {
        create: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: "ADMIN",
        },
      },
    },
  });

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${client.id}`);
}

export async function toggleClientActive(clientId: string, isActive: boolean) {
  await requireSuperAdmin();
  await prisma.client.update({ where: { id: clientId }, data: { isActive } });
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
}

export async function updateClient(clientId: string, formData: FormData) {
  await requireSuperAdmin();

  const name = (formData.get("name") as string)?.trim();
  const businessType = formData.get("businessType") as BusinessType;
  const billingCycle = formData.get("billingCycle") as BillingCycle;
  if (!name || !businessType || !billingCycle) {
    return "Name, business type and billing plan are required";
  }

  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  let logoUrl = client.logoUrl ?? undefined;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logoUrl = await saveLogoFile(logoFile, client.slug);
    } catch (error) {
      return error instanceof Error ? error.message : "Failed to upload logo";
    }
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { name, businessType, billingCycle, logoUrl },
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  return undefined;
}

const SECRET_FIELD = {
  swiggy: "swiggyWebhookSecret",
  zomato: "zomatoWebhookSecret",
  website: "websiteWebhookSecret",
} as const;

export async function regenerateWebhookSecret(
  clientId: string,
  source: keyof typeof SECRET_FIELD,
) {
  await requireSuperAdmin();
  const field = SECRET_FIELD[source];

  await prisma.client.update({
    where: { id: clientId },
    data: { [field]: crypto.randomUUID() },
  });
  revalidatePath(`/admin/clients/${clientId}`);
}
