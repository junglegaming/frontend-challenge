import { useQuery } from "@tanstack/react-query";
import { getNfts, getNftById } from "./api";


export function useNfts() {
  return useQuery({
    queryKey: ["nfts"],
    queryFn: getNfts,
  });
}

export function useNft(id: string) {
  return useQuery({
    queryKey: ["nfts", id],
    queryFn: () => getNftById(id),
  })
}