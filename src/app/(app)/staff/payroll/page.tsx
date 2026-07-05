import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentClientId } from "@/lib/current-client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GeneratePayrollButton, MarkPaidButton, PayrollLineForm } from "./payroll-controls";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const clientId = await requireCurrentClientId();
  const now = new Date();
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const payrolls = await prisma.payroll.findMany({
    where: { month, year, staff: { clientId } },
    orderBy: { staff: { name: "asc" } },
    include: { staff: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Payroll</h1>
          <p className="text-sm text-muted-foreground">
            Monthly salary, incentives, overtime and deductions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            nativeButton={false}
            render={
              <Link href={`/staff/payroll?month=${prevMonth}&year=${prevYear}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            }
          />
          <span className="text-sm font-medium w-32 text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <Button
            variant="outline"
            size="icon"
            nativeButton={false}
            render={
              <Link href={`/staff/payroll?month=${nextMonth}&year=${nextYear}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          <GeneratePayrollButton month={month} year={year} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Base salary</TableHead>
                <TableHead>Incentive / OT / Deduction</TableHead>
                <TableHead>Net pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.staff.name}</TableCell>
                  <TableCell>{formatCurrency(p.baseSalary.toString())}</TableCell>
                  <TableCell>
                    <PayrollLineForm
                      payrollId={p.id}
                      incentives={p.incentives.toString()}
                      overtimePay={p.overtimePay.toString()}
                      deductions={p.deductions.toString()}
                      editable={p.status === "DRAFT"}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.netPay.toString())}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "PAID" ? "secondary" : "outline"} className="capitalize">
                      {p.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.status === "DRAFT" && <MarkPaidButton payrollId={p.id} />}
                  </TableCell>
                </TableRow>
              ))}
              {payrolls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No payroll generated for {MONTH_NAMES[month - 1]} {year} yet.
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
