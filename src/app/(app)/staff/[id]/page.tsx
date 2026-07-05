import { notFound } from "next/navigation";
import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ROLE_ITEMS } from "../role-select-items";
import { StaffDialog } from "../add-staff-dialog";
import { LeaveRequestForm } from "./leave-request-form";
import { LeaveDecisionButtons } from "./leave-actions";

export default async function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = await requireCurrentClientId();

  const staff = await prisma.staff.findFirst({
    where: { id, clientId },
    include: {
      attendance: { where: { date: { gte: subDays(new Date(), 30) } }, orderBy: { date: "desc" } },
      leaveRequests: { orderBy: { createdAt: "desc" } },
      payrolls: { orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
  });

  if (!staff) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{staff.name}</h1>
          <p className="text-sm text-muted-foreground">
            {ROLE_ITEMS[staff.role]} &middot; {staff.phone} &middot;{" "}
            {formatCurrency(staff.baseSalary.toString())}/month
            {!staff.isActive && (
              <>
                {" "}
                <Badge variant="destructive">Inactive</Badge>
              </>
            )}
          </p>
        </div>
        <StaffDialog
          staff={{
            id: staff.id,
            name: staff.name,
            phone: staff.phone,
            role: staff.role,
            baseSalary: staff.baseSalary.toString(),
          }}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {staff.attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock in</TableHead>
                    <TableHead>Clock out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.attendance.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{new Intl.DateTimeFormat("en-IN").format(a.date)}</TableCell>
                      <TableCell>{a.clockIn ? formatDateTime(a.clockIn) : "-"}</TableCell>
                      <TableCell>{a.clockOut ? formatDateTime(a.clockOut) : "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={a.status === "PRESENT" ? "default" : "destructive"}
                          className="capitalize"
                        >
                          {a.status.toLowerCase().replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payroll history</CardTitle>
          </CardHeader>
          <CardContent>
            {staff.payrolls.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payroll generated yet.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {staff.payrolls.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <span className="text-sm">
                      {p.month}/{p.year}
                    </span>
                    <span className="font-medium">{formatCurrency(p.netPay.toString())}</span>
                    <Badge variant={p.status === "PAID" ? "secondary" : "outline"} className="capitalize">
                      {p.status.toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave requests</CardTitle>
          </CardHeader>
          <CardContent>
            {staff.leaveRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leave requests yet.</p>
            ) : (
              <div className="flex flex-col divide-y">
                {staff.leaveRequests.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-2 gap-3">
                    <div>
                      <p className="text-sm font-medium capitalize">{l.type.toLowerCase()} leave</p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("en-IN").format(l.startDate)} -{" "}
                        {new Intl.DateTimeFormat("en-IN").format(l.endDate)}
                        {l.reason ? ` · ${l.reason}` : ""}
                      </p>
                    </div>
                    {l.status === "PENDING" ? (
                      <LeaveDecisionButtons leaveId={l.id} />
                    ) : (
                      <Badge variant={l.status === "APPROVED" ? "default" : "destructive"} className="capitalize">
                        {l.status.toLowerCase()}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request leave</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaveRequestForm staffId={staff.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
