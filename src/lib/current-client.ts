import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { BusinessType } from "@/generated/prisma/enums";

/** For client-scoped pages: returns the current user's clientId, or redirects to /login. */
export async function requireCurrentClientId(): Promise<string> {
  const session = await auth();
  if (!session?.user || session.user.isSuperAdmin || !session.user.clientId) {
    redirect("/login");
  }
  return session.user.clientId;
}

/** Like requireCurrentClientId, but also returns the client's businessType for vertical-aware UI. */
export async function requireCurrentClientContext(): Promise<{
  clientId: string;
  businessType: BusinessType;
}> {
  const session = await auth();
  if (!session?.user || session.user.isSuperAdmin || !session.user.clientId) {
    redirect("/login");
  }
  return {
    clientId: session.user.clientId,
    // Sessions signed before this field existed won't have it in their JWT
    // yet (JWT sessions aren't re-fetched from the DB until re-login).
    businessType: session.user.clientBusinessType ?? "RESTAURANT",
  };
}
