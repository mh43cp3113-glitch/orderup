"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { startOfDay } from "date-fns";
import type { LeaveStatus, LeaveType, Role } from "@/generated/prisma/enums";

const STAFF_ADMIN_ROLES = ["ADMIN", "MANAGER"] as const;

export async function createStaff(_prev: string | undefined, formData: FormData) {
  const { clientId } = await requireRole([...STAFF_ADMIN_ROLES]);

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const role = formData.get("role") as Role;
  const baseSalary = Number(formData.get("baseSalary")) || 0;

  if (!name || !phone || !role) return "Name, phone and role are required";

  const existing = await prisma.staff.findUnique({ where: { clientId_phone: { clientId, phone } } });
  if (existing) return `A staff member with phone ${phone} already exists`;

  await prisma.staff.create({ data: { name, phone, role, baseSalary, clientId } });
  revalidatePath("/staff");
  return undefined;
}

export async function updateStaff(staffId: string, _prev: string | undefined, formData: FormData) {
  const { clientId } = await requireRole([...STAFF_ADMIN_ROLES]);

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const role = formData.get("role") as Role;
  const baseSalary = Number(formData.get("baseSalary")) || 0;

  if (!name || !phone || !role) return "Name, phone and role are required";

  await prisma.staff.updateMany({
    where: { id: staffId, clientId },
    data: { name, phone, role, baseSalary },
  });
  revalidatePath("/staff");
  revalidatePath(`/staff/${staffId}`);
  return undefined;
}

export async function toggleStaffActive(staffId: string, isActive: boolean) {
  const { clientId } = await requireRole([...STAFF_ADMIN_ROLES]);
  await prisma.staff.updateMany({ where: { id: staffId, clientId }, data: { isActive } });
  revalidatePath("/staff");
  revalidatePath(`/staff/${staffId}`);
}

export async function deleteStaff(staffId: string) {
  const { clientId } = await requireRole([...STAFF_ADMIN_ROLES]);
  await prisma.staff.deleteMany({ where: { id: staffId, clientId } });
  revalidatePath("/staff");
}

// --- Attendance ---

export async function clockIn(staffId: string) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);
  const staff = await prisma.staff.findFirst({ where: { id: staffId, clientId } });
  if (!staff) throw new Error("Staff not found");

  const date = startOfDay(new Date());

  await prisma.attendance.upsert({
    where: { staffId_date: { staffId, date } },
    update: { clockIn: new Date(), status: "PRESENT" },
    create: { staffId, date, clockIn: new Date(), status: "PRESENT" },
  });
  revalidatePath("/staff/attendance");
  revalidatePath(`/staff/${staffId}`);
}

export async function clockOut(staffId: string) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);
  const staff = await prisma.staff.findFirst({ where: { id: staffId, clientId } });
  if (!staff) throw new Error("Staff not found");

  const date = startOfDay(new Date());

  await prisma.attendance.upsert({
    where: { staffId_date: { staffId, date } },
    update: { clockOut: new Date() },
    create: { staffId, date, clockOut: new Date(), status: "PRESENT" },
  });
  revalidatePath("/staff/attendance");
  revalidatePath(`/staff/${staffId}`);
}

export async function markAbsent(staffId: string) {
  const { clientId } = await requireRole(["ADMIN", "MANAGER"]);
  const staff = await prisma.staff.findFirst({ where: { id: staffId, clientId } });
  if (!staff) throw new Error("Staff not found");

  const date = startOfDay(new Date());

  await prisma.attendance.upsert({
    where: { staffId_date: { staffId, date } },
    update: { status: "ABSENT", clockIn: null, clockOut: null },
    create: { staffId, date, status: "ABSENT" },
  });
  revalidatePath("/staff/attendance");
  revalidatePath(`/staff/${staffId}`);
}

// --- Leave requests ---

export async function requestLeave(staffId: string, _prev: string | undefined, formData: FormData) {
  const { clientId } = await requireRole([...STAFF_ADMIN_ROLES]);
  const staff = await prisma.staff.findFirst({ where: { id: staffId, clientId } });
  if (!staff) return "Staff not found";

  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const type = formData.get("type") as LeaveType;
  const reason = (formData.get("reason") as string) || undefined;

  if (!startDate || !endDate || !type) return "Start date, end date and type are required";
  if (new Date(endDate) < new Date(startDate)) return "End date must be after start date";

  await prisma.leaveRequest.create({
    data: { staffId, startDate: new Date(startDate), endDate: new Date(endDate), type, reason },
  });
  revalidatePath(`/staff/${staffId}`);
  return undefined;
}

export async function decideLeave(leaveId: string, status: LeaveStatus) {
  const { clientId } = await requireRole([...STAFF_ADMIN_ROLES]);
  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, staff: { clientId } },
  });
  if (!leave) throw new Error("Leave request not found");

  await prisma.leaveRequest.update({ where: { id: leaveId }, data: { status } });
  revalidatePath(`/staff/${leave.staffId}`);
}

// --- Payroll ---

export async function generatePayroll(month: number, year: number) {
  const { clientId } = await requireRole([...STAFF_ADMIN_ROLES]);

  const activeStaff = await prisma.staff.findMany({ where: { isActive: true, clientId } });

  for (const staff of activeStaff) {
    const existing = await prisma.payroll.findUnique({
      where: { staffId_month_year: { staffId: staff.id, month, year } },
    });
    if (existing) continue;

    await prisma.payroll.create({
      data: {
        staffId: staff.id,
        month,
        year,
        baseSalary: staff.baseSalary,
        netPay: staff.baseSalary,
      },
    });
  }

  revalidatePath("/staff/payroll");
}

export async function updatePayrollLine(payrollId: string, formData: FormData) {
  const { clientId } = await requireRole([...STAFF_ADMIN_ROLES]);

  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, staff: { clientId } },
  });
  if (!payroll) throw new Error("Payroll entry not found");

  const incentives = Number(formData.get("incentives")) || 0;
  const overtimePay = Number(formData.get("overtimePay")) || 0;
  const deductions = Number(formData.get("deductions")) || 0;

  const netPay = Number(payroll.baseSalary) + incentives + overtimePay - deductions;

  await prisma.payroll.update({
    where: { id: payrollId },
    data: { incentives, overtimePay, deductions, netPay },
  });
  revalidatePath("/staff/payroll");
}

export async function markPayrollPaid(payrollId: string) {
  const { clientId } = await requireRole([...STAFF_ADMIN_ROLES]);
  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, staff: { clientId } },
  });
  if (!payroll) throw new Error("Payroll entry not found");

  await prisma.payroll.update({
    where: { id: payrollId },
    data: { status: "PAID", paidAt: new Date() },
  });
  revalidatePath("/staff/payroll");
}
