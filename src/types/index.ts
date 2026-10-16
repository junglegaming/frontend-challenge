export type NFT = {
  id: string;
  name: string;
  image: string;
  category: string;
  network: string;
  price: string;
  previousPrice?: string;
  stock: number;
  version: number;
  creator: string;
  rarity?: string;
  rating?: number;
  reviews?: { id: string; author: string; rating: number; text: string }[];
  editions: { id: string; label: string; stock: number }[];
};
export type Wallet = {
  id: string;
  label: string;
  address: string;
  network: string;
  primary: boolean;
  displayName?: string;
  profileName?: string;
  email?: string;
  ens?: string;
  secondaryWallet?: string;
  referral?: string;
  provider?: string;
};
export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  ens: string;
  walletAlias: string;
  avatar: string;
  wallets: Wallet[];
};
export type CartLine = { nftId: string; edition: string; quantity: number };
export type PricedLine = CartLine & { nft: NFT; lineTotal: string };
export type Quote = {
  id: string;
  items: PricedLine[];
  subtotal: string;
  discount: string;
  fee: string;
  total: string;
  coupon: string;
  fingerprint: string;
  expiresAt: number;
};
export type Order = {
  id: string;
  userId: string;
  status: "pending" | "confirmed" | "declined";
  quote: Quote;
  version: number;
  transaction: string;
  createdAt: string;
  reason?: string;
  payment?: {
    provider: string;
    network: string;
    walletLabel: string;
    walletAddress: string;
  };
};
export type CatalogSearch = {
  q: string;
  category: string;
  network: string;
  sort: string;
  page: number;
  max: string;
  favorites: boolean;
};
export type Catalog = { items: NFT[]; total: number; pages: number };
export type RealtimeEvent = {
  eventId: string;
  resourceId: string;
  version: number;
  userId?: string;
};
