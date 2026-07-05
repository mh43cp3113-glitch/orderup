import { Badge } from "@/components/ui/badge";
import type { OrderStatus, KitchenStatus, OrderSource } from "@/generated/prisma/enums";

const ORDER_STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  CONFIRMED: "secondary",
  PREPARING: "secondary",
  READY: "default",
  SERVED: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={ORDER_STATUS_VARIANT[status]} className="capitalize">
      {status.toLowerCase()}
    </Badge>
  );
}

const KITCHEN_STATUS_VARIANT: Record<KitchenStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  COOKING: "secondary",
  READY: "default",
  SERVED: "secondary",
};

export function KitchenStatusBadge({ status }: { status: KitchenStatus }) {
  return (
    <Badge variant={KITCHEN_STATUS_VARIANT[status]} className="capitalize">
      {status.toLowerCase()}
    </Badge>
  );
}

const SOURCE_LABEL: Record<OrderSource, string> = {
  POS: "In-house",
  WEBSITE: "Website",
  SWIGGY: "Swiggy",
  ZOMATO: "Zomato",
};

export function OrderSourceBadge({ source }: { source: OrderSource }) {
  if (source === "POS") return null;
  return (
    <Badge variant="outline" className="capitalize">
      {SOURCE_LABEL[source]}
    </Badge>
  );
}
