import { nfts } from "@/data/nfts";

const ITEMS_PER_PAGE = 5;

export function useNftList(currentNftId?: string) {
  const filteredNfts = nfts.filter((nft) => nft.id !== currentNftId);
  const totalPages = Math.ceil(filteredNfts.length / ITEMS_PER_PAGE);

  return {
    filteredNfts,
    totalPages,
  };
}
