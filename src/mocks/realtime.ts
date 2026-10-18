import { ws } from "msw";
import { toSocketIo } from "@mswjs/socket.io-binding";
import { nfts } from "./fixtures/nfts";
import type { NftUpdatedPayload, OrderUpdatedPayload } from "@/realtime/types";
import type { CreateOrderInput, Order } from "@/contracts/order";

interface MockOrderRecord {
  order: Order;
  input: CreateOrderInput;
  outcome: OrderUpdatedPayload["status"];
}

const ORDERS_STORAGE_KEY = "kurio-mock-orders";
const ORDER_DELAY = 6000;
const ordersById = new Map<string, MockOrderRecord>();
const ordersByIdempotencyKey = new Map<string, MockOrderRecord>();
const orderTimers = new Map<string, ReturnType<typeof setTimeout>>();
const orderConnections = new Set<(payload: OrderUpdatedPayload) => void>();

export function isCreateOrderInput(value: unknown): value is CreateOrderInput {
  if (typeof value !== "object" || value === null) return false;
  if (!("items" in value) || !Array.isArray(value.items) || !value.items.length) return false;

  return (
    "idempotencyKey" in value && typeof value.idempotencyKey === "string" &&
    Boolean(value.idempotencyKey.trim()) &&
    "total" in value && typeof value.total === "number" &&
    Number.isFinite(value.total) && value.total >= 0 &&
    value.items.every((item: unknown) =>
      typeof item === "object" && item !== null &&
      "nftId" in item && typeof item.nftId === "string" &&
      nfts.some((nft) => nft.id === item.nftId) &&
      "quantity" in item && typeof item.quantity === "number" &&
      Number.isSafeInteger(item.quantity) && item.quantity > 0,
    )
  );
}

function isMockOrderRecord(value: unknown): value is MockOrderRecord {
  if (typeof value !== "object" || value === null) return false;
  if (!("input" in value) || !isCreateOrderInput(value.input)) return false;
  if (!("outcome" in value) || !["confirmed", "rejected"].includes(String(value.outcome))) return false;
  if (!("order" in value) || typeof value.order !== "object" || value.order === null) return false;

  const order = value.order;
  return (
    "id" in order && typeof order.id === "string" &&
    "idempotencyKey" in order && order.idempotencyKey === value.input.idempotencyKey &&
    "total" in order && order.total === value.input.total &&
    "createdAt" in order && typeof order.createdAt === "string" &&
    Number.isFinite(Date.parse(order.createdAt)) &&
    "updatedAt" in order && typeof order.updatedAt === "string" &&
    Number.isFinite(Date.parse(order.updatedAt)) &&
    "status" in order && (
      order.status === "pending" || order.status === "rejected" ||
      (order.status === "confirmed" && "transactionId" in order && typeof order.transactionId === "string")
    )
  );
}

function persistOrders() {
  try {
    sessionStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([...ordersById.values()]));
  } catch {
    // The in-memory mock remains usable when browser storage is unavailable.
  }
}

function scheduleOrder(record: MockOrderRecord) {
  if (record.order.status !== "pending" || orderTimers.has(record.order.id)) return;

  const delay = Math.max(0, Date.parse(record.order.createdAt) + ORDER_DELAY - Date.now());
  const timer = setTimeout(() => {
    orderTimers.delete(record.order.id);
    if (record.order.status !== "pending") return;

    const updatedAt = new Date().toISOString();
    const update: OrderUpdatedPayload = record.outcome === "confirmed"
      ? {
          id: record.order.id,
          status: "confirmed",
          transactionId: `tx-${crypto.randomUUID()}`,
          updatedAt,
        }
      : { id: record.order.id, status: "rejected", updatedAt };

    record.order = { ...record.order, ...update };
    persistOrders();
    orderConnections.forEach((emit) => emit(update));
  }, delay);

  orderTimers.set(record.order.id, timer);
}

// Rehydrate the mock server so a reload can reconcile the existing order by REST.
try {
  const saved: unknown = JSON.parse(sessionStorage.getItem(ORDERS_STORAGE_KEY) ?? "[]");
  if (Array.isArray(saved) && saved.every(isMockOrderRecord)) {
    for (const record of saved) {
      ordersById.set(record.order.id, record);
      ordersByIdempotencyKey.set(record.order.idempotencyKey, record);
      scheduleOrder(record);
    }
  } else {
    sessionStorage.removeItem(ORDERS_STORAGE_KEY);
  }
} catch {
  // Malformed snapshots must not prevent the mock server from starting.
}

export function getMockOrder(id: string) {
  return ordersById.get(id)?.order;
}

export function getMockOrderByIdempotencyKey(key: string) {
  return ordersByIdempotencyKey.get(key);
}

export function createMockOrder(
  input: CreateOrderInput,
  outcome: OrderUpdatedPayload["status"] = "confirmed",
): Order {
  const createdAt = new Date().toISOString();
  const order: Order = {
    id: `order-${crypto.randomUUID()}`,
    idempotencyKey: input.idempotencyKey,
    status: "pending",
    total: input.total,
    createdAt,
    updatedAt: createdAt,
  };
  const record: MockOrderRecord = { order, input, outcome };
  ordersById.set(order.id, record);
  ordersByIdempotencyKey.set(input.idempotencyKey, record);
  persistOrders();
  scheduleOrder(record);
  return order;
}

const STORAGE_KEY = "kurio-realtime-nft-1-price";
const UPDATED_PRICE = "2.48";
const nft = nfts.find((item) => item.id === "nft-1");

// Restore only the spike's known price before any REST handler serves the fixture.
try {
  if (nft && localStorage.getItem(STORAGE_KEY) === UPDATED_PRICE) {
    nft.price = UPDATED_PRICE;
  }
} catch {
  // The in-memory mock still works when browser storage is unavailable.
}

const realtime = ws.link(window.location.origin.replace(/^http/, "ws"));

export const realtimeHandlers = [
  realtime.addEventListener("connection", (connection) => {
    const io = toSocketIo(connection);
    const emitOrderUpdate = (payload: OrderUpdatedPayload) => io.client.emit("order.updated", payload);
    orderConnections.add(emitOrderUpdate);

    const timer = setTimeout(() => {
      if (!nft) return;

      const payload: NftUpdatedPayload = {
        id: nft.id,
        changes: { price: UPDATED_PRICE },
      };

      Object.assign(nft, payload.changes);
      try {
        localStorage.setItem(STORAGE_KEY, UPDATED_PRICE);
      } catch {
        // REST and realtime still share the same fixture during this runtime.
      }

      io.client.emit("nft.updated", payload);
    }, 5000);

    connection.client.addEventListener("close", () => {
      clearTimeout(timer);
      orderConnections.delete(emitOrderUpdate);
    });
  }),
];

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    orderTimers.forEach(clearTimeout);
    orderConnections.clear();
  });
}
