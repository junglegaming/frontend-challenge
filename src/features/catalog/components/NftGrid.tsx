import type { Nft } from '@/shared/contracts'

import { NftCard } from './NftCard'

/** Cards na primeira linha da grade no maior layout (3 colunas em `xl`). */
const DESKTOP_FIRST_ROW = 3

/** Props de {@link NftGrid}. */
interface NftGridProps {
  /** NFTs da página atual. */
  nfts: Nft[]
  /** Ids marcados como favoritos pelo usuário. */
  favoriteIds: Set<string>
  /** Alterna o favorito de um NFT. */
  onToggleFavorite: (nftId: string, favorite: boolean) => void
}

/**
 * Grade responsiva do catálogo:
 * - Mobile: layout escalonado em 2 colunas (Column L e Column R com 32px de offset)
 * - Desktop: 2 colunas em sm e 3 colunas em lg conforme Figma
 *
 * @param props - {@link NftGridProps}
 * @returns Lista de cards de NFT.
 */
export function NftGrid({ nfts, favoriteIds, onToggleFavorite }: NftGridProps) {
  const leftColumnNfts = nfts.filter((_, idx) => idx % 2 === 0)
  const rightColumnNfts = nfts.filter((_, idx) => idx % 2 === 1)

  return (
    <>
      {/* Mobile Staggered 2-Column Grid (Figma Mobile / Início) */}
      <div className="mx-auto grid w-full max-w-[366px] grid-cols-2 gap-4 sm:hidden">
        {/* Column L (P-1, P-3, ...) */}
        <div className="flex w-full flex-col gap-6">
          {leftColumnNfts.map((nft, idx) => (
            <NftCard
              key={nft.id}
              nft={nft}
              isFavorite={favoriteIds.has(nft.id)}
              onToggleFavorite={onToggleFavorite}
              mobile
              isPriority={idx === 0}
            />
          ))}
        </div>

        {/* Column R (P-2, P-4, ... com offset de 32px) */}
        <div className="flex w-full flex-col gap-6 pt-8">
          {rightColumnNfts.map((nft, idx) => (
            <NftCard
              key={nft.id}
              nft={nft}
              isFavorite={favoriteIds.has(nft.id)}
              onToggleFavorite={onToggleFavorite}
              mobile
              isPriority={idx === 0}
            />
          ))}
        </div>
      </div>

      {/* Desktop Grid */}
      <ul className="hidden w-full sm:grid sm:grid-cols-2 sm:gap-6 lg:gap-x-[34px] lg:gap-y-[72px] xl:w-[842px] xl:grid-cols-3">
        {nfts.map((nft, idx) => (
          <li key={nft.id} className="flex justify-center">
            <NftCard
              nft={nft}
              isFavorite={favoriteIds.has(nft.id)}
              onToggleFavorite={onToggleFavorite}
              isPriority={idx < DESKTOP_FIRST_ROW}
            />
          </li>
        ))}
      </ul>
    </>
  )
}
