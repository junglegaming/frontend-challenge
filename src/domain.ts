export type Nft = {
  id: string;
  name: string;
  artist: string;
  category: string;
  price: string;
  stock: number;
  version: number;
  color: string;
  image: string;
  editions: string[];
  editionStock: Record<string, number>;
};
export type Wallet = {
  id: string;
  name: string;
  address: string;
  network: string;
  primary: boolean;
};
export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  wallets: Wallet[];
  favorites: string[];
};
export type CartItem = { id: string; edition: string; quantity: number };
export type Cart = { items: CartItem[]; coupon: string };
export type Quote = {
  items: (CartItem & { name: string; price: string; image: string })[];
  subtotal: string;
  discount: string;
  fee: string;
  total: string;
  fingerprint: string;
  coupon: string;
};
export type Order = {
  id: string;
  userId: string;
  status: "pending" | "confirmed" | "refused";
  quote: Quote;
  wallet: Wallet;
  collector: Collector;
  createdAt: string;
  settlesAt: number;
  outcome: "confirmed" | "refused";
  transaction: string;
  version: number;
};
export type Scenario =
  | "standard"
  | "slow"
  | "variable"
  | "offline"
  | "server-error"
  | "expired"
  | "favorite-error"
  | "price-change"
  | "sold-out"
  | "order-timeout"
  | "payment-refused"
  | "order-pending";
export type Collector = {
  name: string;
  email: string;
  country: string;
  phone: string;
};
export const scenarios: Scenario[] = [
  "standard",
  "slow",
  "variable",
  "offline",
  "server-error",
  "expired",
  "favorite-error",
  "price-change",
  "sold-out",
  "order-timeout",
  "payment-refused",
  "order-pending",
];
export const wei = (value: string) => {
  const [a, b = ""] = value.split(".");
  return BigInt(a) * 10n ** 18n + BigInt(b.padEnd(18, "0"));
};
export const eth = (value: bigint) => {
  const raw = (value % 10n ** 18n)
    .toString()
    .padStart(18, "0")
    .replace(/0+$/, "");
  return `${value / 10n ** 18n}${raw ? "." + raw : ""}`;
};
export const totalLine = (price: string, quantity: number) =>
  eth(wei(price) * BigInt(quantity));
