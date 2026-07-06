import type { NextAuthConfig } from "next-auth";
import type { Role, BusinessType } from "@/generated/prisma/enums";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname === "/login";
      const isSuperAdmin = auth?.user?.isSuperAdmin ?? false;
      const isAdminArea = request.nextUrl.pathname.startsWith("/admin");

      if (!isLoggedIn && !isLoginPage) return false;

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL(isSuperAdmin ? "/admin" : "/dashboard", request.nextUrl));
      }

      // Super admins operate the platform, not an individual client's day-to-day
      // pages, and vice versa — keep the two areas separate.
      if (isLoggedIn && isSuperAdmin && !isAdminArea) {
        return Response.redirect(new URL("/admin", request.nextUrl));
      }
      if (isLoggedIn && !isSuperAdmin && isAdminArea) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
    // These two callbacks only copy plain fields between the JWT and the session
    // object — no Node/Prisma APIs — so they're safe to run in the Edge runtime too.
    // They must live here (not in auth.ts) so middleware's separate NextAuth(authConfig)
    // instance also exposes isSuperAdmin/clientId/role, not just the full auth.ts one.
    jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          role: Role | null;
          isSuperAdmin: boolean;
          clientId: string | null;
          clientName: string | null;
          clientLogoUrl: string | null;
          clientBusinessType: BusinessType | null;
        };
        token.id = u.id;
        token.role = u.role;
        token.isSuperAdmin = u.isSuperAdmin;
        token.clientId = u.clientId;
        token.clientName = u.clientName;
        token.clientLogoUrl = u.clientLogoUrl;
        token.clientBusinessType = u.clientBusinessType;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role | null;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.clientId = token.clientId as string | null;
        session.user.clientName = token.clientName as string | null;
        session.user.clientLogoUrl = token.clientLogoUrl as string | null;
        session.user.clientBusinessType = token.clientBusinessType as BusinessType | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
