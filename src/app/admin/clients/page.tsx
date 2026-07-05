import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BUSINESS_TYPE_ITEMS } from "./business-type-items";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Businesses</h1>
          <p className="text-sm text-muted-foreground">
            Every business onboarded onto the platform.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/admin/clients/new">
              <Plus className="h-4 w-4" /> New Business
            </Link>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="flex items-center gap-2 font-medium hover:underline"
                    >
                      {client.logoUrl ? (
                        <Image
                          src={client.logoUrl}
                          alt={client.name}
                          width={24}
                          height={24}
                          className="h-6 w-6 rounded object-contain"
                          unoptimized
                        />
                      ) : null}
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{BUSINESS_TYPE_ITEMS[client.businessType]}</TableCell>
                  <TableCell>{client._count.users}</TableCell>
                  <TableCell>
                    <Badge variant={client.isActive ? "secondary" : "destructive"}>
                      {client.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
                      client.createdAt,
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No businesses onboarded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
