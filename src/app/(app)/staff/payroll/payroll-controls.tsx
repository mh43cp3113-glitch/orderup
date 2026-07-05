"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generatePayroll, markPayrollPaid, updatePayrollLine } from "../actions";

export function GeneratePayrollButton({ month, year }: { month: number; year: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => generatePayroll(month, year))}
    >
      {isPending ? "Generating..." : "Generate payroll for this month"}
    </Button>
  );
}

export function PayrollLineForm({
  payrollId,
  incentives,
  overtimePay,
  deductions,
  editable,
}: {
  payrollId: string;
  incentives: string;
  overtimePay: string;
  deductions: string;
  editable: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(() => updatePayrollLine(payrollId, formData));
  }

  return (
    <form action={handleSubmit} className="flex items-center gap-1.5">
      <Input
        name="incentives"
        type="number"
        step="0.01"
        defaultValue={incentives}
        disabled={!editable || isPending}
        className="w-20 h-7"
        placeholder="Incentive"
      />
      <Input
        name="overtimePay"
        type="number"
        step="0.01"
        defaultValue={overtimePay}
        disabled={!editable || isPending}
        className="w-20 h-7"
        placeholder="OT"
      />
      <Input
        name="deductions"
        type="number"
        step="0.01"
        defaultValue={deductions}
        disabled={!editable || isPending}
        className="w-20 h-7"
        placeholder="Deduct"
      />
      {editable && (
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          Save
        </Button>
      )}
    </form>
  );
}

export function MarkPaidButton({ payrollId }: { payrollId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => markPayrollPaid(payrollId))}
    >
      Mark paid
    </Button>
  );
}
