"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateClient } from "../actions";
import { BUSINESS_TYPE_ITEMS } from "../business-type-items";
import { BILLING_CYCLE_ITEMS } from "../billing-cycle-items";
import type { BusinessType, BillingCycle } from "@/generated/prisma/enums";

export function EditClientForm({
  clientId,
  name,
  businessType,
  billingCycle,
}: {
  clientId: string;
  name: string;
  businessType: BusinessType;
  billingCycle: BillingCycle;
}) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateClient(clientId, formData);
      setError(result);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Business name</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="businessType">Business type</Label>
        <Select name="businessType" defaultValue={businessType} items={BUSINESS_TYPE_ITEMS}>
          <SelectTrigger id="businessType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BUSINESS_TYPE_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="billingCycle">Billing plan</Label>
        <Select name="billingCycle" defaultValue={billingCycle} items={BILLING_CYCLE_ITEMS}>
          <SelectTrigger id="billingCycle">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BILLING_CYCLE_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="logo">Replace logo</Label>
        <Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
