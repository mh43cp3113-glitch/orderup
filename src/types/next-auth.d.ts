import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role | null;
      isSuperAdmin: boolean;
      clientId: string | null;
      clientName: string | null;
      clientLogoUrl: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: Role | null;
    isSuperAdmin: boolean;
    clientId: string | null;
    clientName: string | null;
    clientLogoUrl: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role | null;
    isSuperAdmin: boolean;
    clientId: string | null;
    clientName: string | null;
    clientLogoUrl: string | null;
  }
}
