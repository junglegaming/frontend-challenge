import type { Cart, Nft, Order, Scenario, User } from "../domain";
const names = [
  "Cosmic daydream",
  "The other side",
  "Quiet horizons",
  "A new dimension",
  "Electric bloom",
  "Beyond the ordinary",
  "Lost in the moment",
  "Digital soul",
  "Parallel worlds",
  "Soft machinery",
  "Into the unknown",
  "Golden hour",
  "Future nostalgia",
  "Liquid thoughts",
  "Midnight garden",
  "Chromatic waves",
  "Inner universe",
  "Still in motion",
  "Ethereal form",
  "Dream state",
  "After the rain",
  "Infinite possibilities",
  "Pure imagination",
  "New beginnings",
];
export const fixtureNfts: Nft[] = names.map((name, i) => ({
  id: String(i + 1),
  name,
  artist: ["Sofia Chen", "Lucas Martins", "Alex Rivera", "Maya Studio"][i % 4],
  category: ["3D Art", "Abstract", "Photography", "Illustration"][i % 4],
  price: ["0.24", "0.38", "0.15", "0.62", "1.2", "0.08"][i % 6],
  stock: i === 7 ? 0 : 8 + (i % 5),
  version: 1,
  color: ["#b8a3ef", "#edb89a", "#a9cbbd", "#cad1ee"][i % 4],
  image:
    "/art/" +
    ["golden-signal", "violet-nomad", "sage-nomad", "golden-frequency"][i % 4] +
    ".webp",
  editions: ["Original", "Artist proof"],
  editionStock: {
    Original: i === 7 ? 0 : 8 + (i % 5),
    "Artist proof": i % 3 === 0 ? 0 : 2,
  },
}));
export const fixtureUsers: User[] = [
  {
    id: "u1",
    name: "Alex Morgan",
    email: "alex@example.com",
    avatar: "",
    wallets: [
      {
        id: "w1",
        name: "Minha carteira",
        address: "0x1234567890abcdef1234567890abcdef12345678",
        network: "Ethereum",
        primary: true,
      },
    ],
    favorites: [],
  },
  {
    id: "u2",
    name: "Sam Rivera",
    email: "sam@example.com",
    avatar: "",
    wallets: [],
    favorites: [],
  },
];
export type DB = {
  nfts: Nft[];
  users: User[];
  hashes: Record<string, string>;
  session: string | null;
  expires: number;
  guest: Cart;
  carts: Record<string, Cart>;
  orders: Order[];
  keys: Record<string, { body: string; order: string }>;
  scenario: Scenario;
  sequence: number;
};
const key = "jungle.mock.v1";
export function fresh(): DB {
  return {
    nfts: structuredClone(fixtureNfts),
    users: structuredClone(fixtureUsers),
    hashes: {},
    session: null,
    expires: 0,
    guest: { items: [], coupon: "" },
    carts: {},
    orders: [],
    keys: {},
    scenario: "standard",
    sequence: 0,
  };
}
export let db: DB = (() => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fresh();
  } catch {
    return fresh();
  }
})();
export function save() {
  localStorage.setItem(key, JSON.stringify(db));
}
export function reset(scenario: Scenario = "standard") {
  db = fresh();
  db.scenario = scenario;
  save();
}
export async function hash(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`jungle-demo:${value}`),
  );
  return Array.from(new Uint8Array(bytes), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
export async function initialize() {
  for (const user of fixtureUsers) {
    db.hashes[user.id] ||= await hash("Jungle123!");
  }
  save();
}
