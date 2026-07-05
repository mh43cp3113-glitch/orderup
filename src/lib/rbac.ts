import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";

/**
 * Requires a logged-in client user (not a platform super-admin) with one of the
 * given roles. Returns the user together with a guaranteed non-null `clientId` so
 * callers can scope every query/mutation to that client.
 */
export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.isSuperAdmin ||
    !session.user.clientId ||
    !session.user.role ||
    !allowed.includes(session.user.role)
  ) {
    throw new Error("Forbidden: insufficient permissions for this action");
  }
  return { ...session.user, clientId: session.user.clientId, role: session.user.role };
}

/** Requires a logged-in platform super-admin (manages clients, not client data). */
export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || !session.user.isSuperAdmin) {
    throw new Error("Forbidden: super admin only");
  }
  return session.user;
}
