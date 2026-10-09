import type { QueryClient } from '@tanstack/react-query';
import type { Nft, NftListResponse } from '@/types/api';
import { keyFactory } from '@/lib/query/keys';
import { nftUpdatedEventSchema, type NftUpdated } from './events';

// Kept in the cache layer so both Socket.IO and late REST responses use one ordering rule.
export function newestNft(client: QueryClient, incoming: Nft): Nft {
  const current = client.getQueryData<Nft>(keyFactory.nfts.detail(incoming.id));
  const event = client.getQueryData<NftUpdated>(
    keyFactory.nfts.event(incoming.id)
  );
  const latest =
    current && current.version > incoming.version ? current : incoming;
  return event && event.version > latest.version
    ? {
        ...latest,
        ...event.payload,
        version: event.version,
        updatedAt: event.ts,
      }
    : latest;
}

export function applyNftEvent(client: QueryClient, raw: unknown) {
  const parsed = nftUpdatedEventSchema.safeParse(raw);
  if (!parsed.success) return;
  const event = parsed.data;
  const detailKey = keyFactory.nfts.detail(event.resourceId);
  const current = client.getQueryData<Nft>(detailKey);
  const lists = client.getQueriesData<NftListResponse>({
    queryKey: keyFactory.nfts.lists,
  });
  const previousEvent = client.getQueryData<NftUpdated>(
    keyFactory.nfts.event(event.resourceId)
  );
  const knownVersion = Math.max(
    previousEvent?.version ?? 0,
    current?.version ?? 0,
    ...lists.map(
      ([, list]) =>
        list?.items.find((nft) => nft.id === event.resourceId)?.version ?? 0
    )
  );
  if (event.version <= knownVersion) {
    if (import.meta.env.DEV)
      console.debug(
        '[socket] nft.updated descartado',
        event.resourceId,
        event.version
      );
    return;
  }
  client.setQueryData(keyFactory.nfts.event(event.resourceId), event);
  const merge = (nft: Nft): Nft => ({
    ...nft,
    ...event.payload,
    version: event.version,
    updatedAt: event.ts,
  });
  if (current) client.setQueryData(detailKey, merge(current));
  else {
    const reference = lists
      .flatMap(([, list]) => list?.items ?? [])
      .find((nft) => nft.id === event.resourceId);
    if (reference) client.setQueryData(detailKey, merge(reference));
  }
  client.setQueriesData<NftListResponse>(
    { queryKey: keyFactory.nfts.lists },
    (list) =>
      list && {
        ...list,
        items: list.items.map((nft) =>
          nft.id === event.resourceId ? merge(nft) : nft
        ),
      }
  );
  void client.invalidateQueries({ queryKey: keyFactory.carts });
  void client.invalidateQueries({ queryKey: keyFactory.quotes });
  return event;
}
