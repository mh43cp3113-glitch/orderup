import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

// Only the Credentials provider (needs Prisma/bcrypt, Node-only) is added here.
// `authConfig`'s callbacks (authorized/jwt/session) carry over via the spread —
// don't redefine `callbacks` in this object, or it silently replaces (not merges
// with) authConfig's, which is what caused middleware to lose isSuperAdmin/clientId.
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { client: true },
        });
        if (!user || !user.isActive) return null;
        if (!user.isSuperAdmin && (!user.client || !user.client.isActive)) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
          clientId: user.clientId,
          clientName: user.client?.name ?? null,
          clientLogoUrl: user.client?.logoUrl ?? null,
        };
      },
    }),
  ],
});
