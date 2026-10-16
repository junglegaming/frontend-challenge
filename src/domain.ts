import type { CatalogSearch } from "./types";

export const toWei = (value: string): bigint => {
  if (!/^\d+(\.\d{1,18})?$/.test(value)) throw new Error("Valor ETH inválido");
  const [a, b = ""] = value.split(".");
  return BigInt(a) * 10n ** 18n + BigInt(b.padEnd(18, "0"));
};
export const fromWei = (value: bigint): string => {
  const integer = value / 10n ** 18n;
  const fraction = (value % 10n ** 18n)
    .toString()
    .padStart(18, "0")
    .replace(/0+$/, "");
  return `${integer}${fraction ? "." + fraction : ""}`;
};
export const eth = (value: string) => `${value.replace(".", ",")} ETH`;
export const categories = [
  "Arte digital",
  "Fotografia",
  "Música",
  "Arte 3D",
  "Colecionáveis",
  "Generative",
  "Jogos",
  "Assinaturas",
  "Utilidade",
];
export const networks = ["Ethereum", "Polygon", "Solana"];
export const defaultSearch: CatalogSearch = {
  q: "",
  category: "",
  network: "",
  sort: "recent",
  page: 1,
  max: "",
  favorites: false,
};
