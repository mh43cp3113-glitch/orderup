"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="flex flex-1 min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary text-primary-foreground p-10">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <UtensilsCrossed className="h-5 w-5" />
          OrderUp
        </div>
        <div className="max-w-sm">
          <h1 className="text-3xl font-semibold leading-tight">
            Run your restaurant, cafe, or bakery from one place.
          </h1>
          <p className="mt-3 text-primary-foreground/80">
            Orders, tables, billing, inventory, staff and payroll — one dashboard for
            your whole operation.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} OrderUp. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-sm border-none shadow-none lg:border lg:shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@restaurant.com"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Demo: admin@restaurant.com / password123
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
