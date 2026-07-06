import type { BusinessType } from "@/generated/prisma/enums";

const BOOKING_TYPES: BusinessType[] = ["RESORT", "FARMHOUSE"];

export function isBookingVertical(businessType: BusinessType): boolean {
  return BOOKING_TYPES.includes(businessType);
}

export function isBakeryVertical(businessType: BusinessType): boolean {
  return businessType === "CAKE_BAKERY";
}

export function ordersLabel(businessType: BusinessType): string {
  return isBookingVertical(businessType) ? "Bookings" : "Orders";
}

export function orderLabelSingular(businessType: BusinessType): string {
  return isBookingVertical(businessType) ? "Booking" : "Order";
}

export function tablesLabel(businessType: BusinessType): string {
  return isBookingVertical(businessType) ? "Rooms" : "Tables";
}

export function tableLabelSingular(businessType: BusinessType): string {
  return isBookingVertical(businessType) ? "Room" : "Table";
}
