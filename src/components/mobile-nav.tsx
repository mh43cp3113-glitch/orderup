"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavSidebar } from "@/components/nav-sidebar";
import { ClientBranding } from "@/components/client-branding";
import type { Role, BusinessType } from "@/generated/prisma/enums";

export function MobileNav({
  role,
  businessType,
  clientName,
  clientLogoUrl,
}: {
  role: Role;
  businessType: BusinessType;
  clientName: string;
  clientLogoUrl: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon-sm" />}
        aria-label="Open navigation menu"
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <ClientBranding name={clientName} logoUrl={clientLogoUrl} />
        </SheetHeader>
        <NavSidebar role={role} businessType={businessType} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
