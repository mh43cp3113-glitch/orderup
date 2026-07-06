"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

/** Indian numbers are stored as 10 digits with no country code; wa.me needs the full code. */
function toWhatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export function WhatsappReceiptButton({ phone, message }: { phone: string; message: string }) {
  const href = `https://wa.me/${toWhatsappNumber(phone)}?text=${encodeURIComponent(message)}`;

  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<a href={href} target="_blank" rel="noopener noreferrer" />}
    >
      <MessageCircle className="h-4 w-4" /> Send on WhatsApp
    </Button>
  );
}
