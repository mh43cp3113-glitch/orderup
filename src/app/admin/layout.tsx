import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Building2 } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <Link href="/admin/clients" className="flex items-center gap-2 font-semibold">
          <Building2 className="h-5 w-5 text-primary" />
          OrderUp <span className="text-muted-foreground font-normal">Admin</span>
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button variant="ghost" size="icon" type="submit" title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </header>
      <main className="flex-1 p-6 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}
