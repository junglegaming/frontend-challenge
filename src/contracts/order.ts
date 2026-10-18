export interface CreateOrderItem {
  nftId: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItem[];
  total: number;
  idempotencyKey: string;
}

interface OrderBase {
  id: string;
  idempotencyKey: string;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export type Order = OrderBase & (
  | { status: "pending"; transactionId?: never }
  | { status: "confirmed"; transactionId: string }
  | { status: "rejected"; transactionId?: never }
);
