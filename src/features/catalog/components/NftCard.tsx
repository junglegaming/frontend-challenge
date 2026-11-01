import { Link } from '@tanstack/react-router'

import { Heart } from 'lucide-react'

import type { Nft } from '@/shared/contracts'
import { cn } from '@/shared/lib/cn'
import { formatEth } from '@/shared/lib/money'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

/** Props de {@link NftCard}. */
interface NftCardProps {
  /** NFT exibido no card. */
  nft: Nft
  /** Se o NFT está nos favoritos do usuário. */
  isFavorite: boolean
  /** Alterna o favorito; recebe o id e o novo estado desejado. */
  onToggleFavorite: (nftId: string, favorite: boolean) => void
  /** Renderiza no formato compacto de coluna móvel do Figma. */
  mobile?: boolean
  /**
   * Card acima da dobra: a arte carrega imediatamente e com prioridade alta,
   * pois é candidata a LCP. Os demais seguem com `loading="lazy"`.
   */
  isPriority?: boolean
}

/**
 * Card do catálogo com arte, nome, coleção, preço e ação de favorito.
 * Suporta o modo desktop e o modo mobile (P-1 a P-4 do Figma Mobile / Início).
 *
 * @param props - {@link NftCardProps}
 * @returns Card de NFT.
 */
export function NftCard({
  nft,
  isFavorite,
  onToggleFavorite,
  mobile,
  isPriority = false,
}: NftCardProps) {
  const loading = isPriority ? 'eager' : 'lazy'
  const fetchPriority = isPriority ? 'high' : 'auto'

  const favoriteLabel = isFavorite
    ? `Remover ${nft.name} dos favoritos`
    : `Adicionar ${nft.name} aos favoritos`

  const isRare = nft.id === 'nft-3' || nft.id === 'nft-7' || nft.name.toLowerCase().includes('raro')

  if (mobile) {
    return (
      <article className="relative flex w-full max-w-[175px] flex-col gap-2">
        {/* Favorite Heart Button (Frame 410) */}
        <button
          type="button"
          aria-pressed={isFavorite}
          aria-label={favoriteLabel}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onToggleFavorite(nft.id, !isFavorite)
          }}
          className={cn(
            'absolute top-2 right-2 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full border border-[#3F2319] bg-[#2F1D15] shadow-sm transition-transform active:scale-90',
            focusRing,
          )}
        >
          <Heart
            aria-hidden="true"
            className={cn(
              'size-3.5 transition-colors duration-150',
              isFavorite ? 'fill-[#D28A4C] text-[#D28A4C]' : 'fill-transparent text-[#D28A4C]',
            )}
          />
        </button>

        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className={cn('group flex flex-col gap-2 text-canvas cursor-pointer', focusRing)}
        >
          {/* Frame 412: 175px x 200px container */}
          <div
            className="relative flex h-[196px] w-full items-center justify-center rounded-[20px] p-1 shadow-md"
            style={{
              background: 'linear-gradient(143.28deg, #241612 -12%, #2F1D15 106.59%)',
            }}
          >
            {/* RARO Badge (Group 61) */}
            {isRare && (
              <span className="absolute top-2.5 left-2.5 z-10 rounded-[4px] bg-[#D28A4C] px-2 py-0.5 font-mono text-[11px] font-medium text-[#140D0A]">
                RARO
              </span>
            )}

            <img
              src={nft.imageUrl}
              alt={`Arte do NFT ${nft.name}`}
              loading={loading}
              fetchPriority={fetchPriority}
              decoding="async"
              className="size-[164px] rounded-[16px] object-cover"
            />
          </div>

          {/* Frame 413: Name & Price */}
          <div className="flex flex-col gap-0.5 px-1">
            <h3 className="truncate font-mono text-[14px] leading-5 font-normal text-[#F5F1EB] transition-colors group-hover:text-highlight">
              {nft.name}
            </h3>
            <p className="font-mono text-[16px] leading-4 font-bold text-[#E89B55]">
              {formatEth(nft.priceEth)} ETH
            </p>
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className="relative flex w-full flex-col gap-3 xl:w-[258px]">
      <button
        type="button"
        aria-pressed={isFavorite}
        aria-label={favoriteLabel}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onToggleFavorite(nft.id, !isFavorite)
        }}
        className={cn(
          'group/fav absolute top-3 right-3 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-[5px] bg-ink shadow-sm',
          focusRing,
        )}
      >
        <Heart
          aria-hidden="true"
          className={cn(
            'size-5 transition-colors duration-150',
            isFavorite
              ? 'fill-primary text-primary'
              : 'fill-transparent text-canvas group-hover/fav:text-primary',
          )}
        />
      </button>

      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className={cn('group flex flex-col gap-3 text-canvas cursor-pointer', focusRing)}
      >
        {/* Rectangle 6: 258px x 300px, background: #241612 */}
        <div className="flex h-[300px] w-full items-center justify-center bg-card xl:w-[258px]">
          <img
            src={nft.imageUrl}
            alt={`Arte do NFT ${nft.name}`}
            loading={loading}
            fetchPriority={fetchPriority}
            decoding="async"
            className="size-[250px] rounded-[15px] object-cover"
          />
        </div>

        {/* Title & Price */}
        <div className="flex flex-col gap-1 w-full">
          <h3 className="truncate font-mono text-[16px] leading-4 font-normal text-foreground transition-colors group-hover:text-highlight">
            {nft.name}
          </h3>
          <p className="font-mono text-[18px] leading-4 font-bold text-highlight">
            {formatEth(nft.priceEth)} ETH
          </p>
        </div>
      </Link>
    </article>
  )
}
