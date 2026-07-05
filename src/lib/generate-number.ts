function todayPrefix(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export function generateOrderNumber(sequence: number): string {
  return `ORD-${todayPrefix()}-${String(sequence).padStart(4, "0")}`;
}

export function generateBillNumber(sequence: number): string {
  return `BILL-${todayPrefix()}-${String(sequence).padStart(4, "0")}`;
}
