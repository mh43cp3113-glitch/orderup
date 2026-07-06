"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "../actions";
import { BUSINESS_TYPE_ITEMS } from "../business-type-items";
import { BILLING_CYCLE_ITEMS } from "../billing-cycle-items";

export function NewClientForm() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createClient(undefined, formData);
      if (result) setError(result);
    });
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Business details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Business name</Label>
            <Input id="name" name="name" required placeholder="e.g. Blue Ribbon Bakery" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="businessType">Business type</Label>
            <Select name="businessType" defaultValue="RESTAURANT" items={BUSINESS_TYPE_ITEMS}>
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
            <Select name="billingCycle" defaultValue="MONTHLY" items={BILLING_CYCLE_ITEMS}>
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
            <Label htmlFor="logo">Logo (optional)</Label>
            <Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
            <p className="text-xs text-muted-foreground">
              PNG, JPEG, WebP or SVG, up to 2MB. If left blank, the business name is shown
              instead once logged in.
            </p>
          </div>

          <div className="border-t pt-4 mt-2 flex flex-col gap-4">
            <p className="text-sm font-medium">Initial admin login</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="adminName">Admin name</Label>
              <Input id="adminName" name="adminName" required placeholder="Owner's name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="adminEmail">Admin email</Label>
                <Input id="adminEmail" name="adminEmail" type="email" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="adminPassword">Temporary password</Label>
                <Input id="adminPassword" name="adminPassword" type="password" required minLength={8} />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create business"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
