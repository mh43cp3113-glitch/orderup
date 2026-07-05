import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { ROLE_ITEMS } from "../role-select-items";
import { AttendanceActions } from "./attendance-actions";

export default async function AttendancePage() {
  const clientId = await requireCurrentClientId();
  const today = startOfDay(new Date());

  const staff = await prisma.staff.findMany({
    where: { isActive: true, clientId },
    orderBy: { name: "asc" },
    include: { attendance: { where: { date: today }, take: 1 } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Today &middot; {new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(today)}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Clock in</TableHead>
                <TableHead>Clock out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => {
                const record = s.attendance[0];
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{ROLE_ITEMS[s.role]}</TableCell>
                    <TableCell>{record?.clockIn ? formatDateTime(record.clockIn) : "-"}</TableCell>
                    <TableCell>{record?.clockOut ? formatDateTime(record.clockOut) : "-"}</TableCell>
                    <TableCell>
                      {record ? (
                        <Badge
                          variant={record.status === "PRESENT" ? "default" : "destructive"}
                          className="capitalize"
                        >
                          {record.status.toLowerCase().replace("_", " ")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not marked</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <AttendanceActions
                        staffId={s.id}
                        hasClockIn={Boolean(record?.clockIn)}
                        hasClockOut={Boolean(record?.clockOut)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No active staff.
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
