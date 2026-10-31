import { nfts } from "../../../../../data/nfts";

export function getCategoryCount(category: string): number {
  return nfts.filter((nft) => nft.category === category).length;
}

export function getNetworkCount(network: string): number {
  return nfts.filter((nft) => nft.network === network).length;
}
