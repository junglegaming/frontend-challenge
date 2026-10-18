import {api} from '@/api/client';
import type { Nft } from '@/contracts/nft';  

export async function getNfts(): Promise<Nft[]> {
    const response = await api.get<Nft[]>("/nfts");
    return response.data;
}

export async function getNftById(id: string): Promise<Nft> {
    const response = await api.get<Nft>(`/nfts/${id}`);
    return response.data;
}