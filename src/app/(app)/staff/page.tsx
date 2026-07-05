import Link from "next/link";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { StaffDialog } from "./add-staff-dialog";
import { ActiveToggle, DeleteStaffButton } from "./staff-row-actions";
import { ROLE_ITEMS } from "./role-select-items";
import { CalendarClock, Wallet } from "lucide-react";

export default async function StaffPage() {
  const clientId = await requireCurrentClientId();
  const today = startOfDay(new Date());

  const staff = await prisma.staff.findMany({
    where: { clientId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { attendance: { where: { date: today }, take: 1 } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Staff</h1>
          <p className="text-sm text-muted-foreground">
            Employee roster, attendance, leave and payroll.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href="/staff/attendance">
                <CalendarClock className="h-4 w-4" /> Attendance
              </Link>
            }
            nativeButton={false}
          />
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href="/staff/payroll">
                <Wallet className="h-4 w-4" /> Payroll
              </Link>
            }
            nativeButton={false}
          />
          <StaffDialog />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Base salary</TableHead>
                <TableHead>Today</TableHead>
                <TableHead>Active</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/staff/${s.id}`} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell>{ROLE_ITEMS[s.role]}</TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>{formatCurrency(s.baseSalary.toString())}</TableCell>
                  <TableCell>
                    {s.attendance[0] ? (
                      <Badge
                        variant={s.attendance[0].status === "PRESENT" ? "default" : "destructive"}
                        className="capitalize"
                      >
                        {s.attendance[0].status.toLowerCase().replace("_", " ")}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not marked</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ActiveToggle staffId={s.id} isActive={s.isActive} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <StaffDialog
                        staff={{
                          id: s.id,
                          name: s.name,
                          phone: s.phone,
                          role: s.role,
                          baseSalary: s.baseSalary.toString(),
                        }}
                      />
                      <DeleteStaffButton staffId={s.id} name={s.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No staff added yet.
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
