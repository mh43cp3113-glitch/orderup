import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { NavSidebar } from "@/components/nav-sidebar";
import { UserMenu } from "@/components/user-menu";
import { ClientBranding } from "@/components/client-branding";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  if (!user || user.isSuperAdmin || !user.clientId || !user.role) {
    redirect("/login");
  }

  const clientName = user.clientName ?? "Business Manager";

  return (
    <div className="flex flex-1 min-h-screen">
      <aside className="hidden md:flex w-60 flex-col border-r bg-background">
        <div className="px-4 py-4 border-b">
          <ClientBranding name={clientName} logoUrl={user.clientLogoUrl} />
        </div>
        <NavSidebar role={user.role} />
      </aside>
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b bg-background px-4 py-3">
          <div className="md:hidden">
            <ClientBranding name={clientName} logoUrl={user.clientLogoUrl} className="text-sm" />
          </div>
          <div className="ml-auto">
            <UserMenu name={user.name ?? "User"} role={user.role} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
