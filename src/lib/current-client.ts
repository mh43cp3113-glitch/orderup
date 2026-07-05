import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** For client-scoped pages: returns the current user's clientId, or redirects to /login. */
export async function requireCurrentClientId(): Promise<string> {
  const session = await auth();
  if (!session?.user || session.user.isSuperAdmin || !session.user.clientId) {
    redirect("/login");
  }
  return session.user.clientId;
}
