"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid3x3,
  ClipboardList,
  Package,
  Receipt,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/enums";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MANAGER", "CASHIER", "WAITER", "CHEF", "ACCOUNTANT"],
  },
  {
    href: "/orders",
    label: "Orders",
    icon: ClipboardList,
    roles: ["ADMIN", "MANAGER", "CASHIER", "WAITER", "CHEF"],
  },
  {
    href: "/tables",
    label: "Tables",
    icon: Grid3x3,
    roles: ["ADMIN", "MANAGER", "WAITER", "CASHIER"],
  },
  {
    href: "/menu",
    label: "Menu",
    icon: UtensilsCrossed,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Package,
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    href: "/billing",
    label: "Billing",
    icon: Receipt,
    roles: ["ADMIN", "MANAGER", "CASHIER", "ACCOUNTANT"],
  },
  {
    href: "/staff",
    label: "Staff",
    icon: Users,
    roles: ["ADMIN", "MANAGER"],
  },
];

export function NavSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
