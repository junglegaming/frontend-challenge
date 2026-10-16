import * as z from "zod/mini";
import type { Catalog, NFT } from "../types";

const count = z.number().check(z.int(), z.minimum(0));
const amount = z.string().check(z.regex(/^\d+(\.\d{1,18})?$/));
const nftSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  image: z.string(),
  category: z.string(),
  network: z.string(),
  price: amount,
  stock: count,
  version: count,
  creator: z.string(),
  editions: z
    .array(z.looseObject({ id: z.string(), label: z.string(), stock: count }))
    .check(z.minLength(1)),
});
const catalogSchema = z.object({
  items: z.array(nftSchema),
  total: count,
  pages: z.number().check(z.int(), z.minimum(1)),
});
export function parseCatalog(value: unknown): Catalog {
  const result = catalogSchema.safeParse(value);
  if (!result.success)
    throw new Error("O catálogo retornou dados inválidos. Tente novamente.");
  return result.data as Catalog;
}
export function parseNFT(value: unknown): NFT {
  const result = nftSchema.safeParse(value);
  if (!result.success)
    throw new Error("Os dados do NFT são inválidos. Tente novamente.");
  return result.data as NFT;
}
export function parseList<T>(value: unknown): T[] {
  if (!Array.isArray(value))
    throw new Error("A lista recebida é inválida. Tente novamente.");
  return value as T[];
}
