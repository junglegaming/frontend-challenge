import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Heart, Loader2 } from 'lucide-react'
import { nftImageProps } from '@/lib/images'
import { cn } from '@/lib/utils'
import type { Nft } from '@/schemas/nft'

interface NftMobileHeroProps {
  nft: Nft
  favorite: boolean
  favoritePending: boolean
  favoriteDisabled: boolean
  onToggleFavorite: () => void
}

export function NftMobileHero({ nft, favorite, favoritePending, favoriteDisabled, onToggleFavorite }: NftMobileHeroProps) {
  const gallery = nft.gallery.length > 0 ? nft.gallery : [nft.image]
  const [active, setActive] = useState(0)
  const current = gallery[Math.min(active, gallery.length - 1)] ?? nft.image

  return (
    <div className="-mx-6 h-[506px] bg-card md:hidden">
      <div className="flex items-start justify-between pl-7 pr-[25px] pt-[23px]">
        <Link
          to="/"
          aria-label="Voltar ao catálogo"
          className="grid size-[35px] place-items-center rounded-full border border-border-soft bg-background/40 text-foreground backdrop-blur"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={favoriteDisabled || favoritePending}
          aria-pressed={favorite}
          aria-label={favorite ? 'Favoritado' : 'Favoritar'}
          aria-busy={favoritePending}
          className="grid size-[35px] place-items-center rounded-full border border-border-soft bg-background/40 text-primary backdrop-blur disabled:opacity-60"
        >
          {favoritePending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Heart className={cn('size-4', favorite && 'fill-primary')} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="relative mt-2 mr-[25px] ml-7">
        <img
          {...nftImageProps(current, '361px')}
          alt={`Arte do NFT ${nft.name}, imagem ${active + 1} de ${gallery.length}`}
          fetchPriority="high"
          className="h-[356px] w-full rounded-3xl object-cover"
        />
        {gallery.length > 1 && (
          <div className="absolute inset-x-0 bottom-[44px] flex justify-center">
            {gallery.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Ver imagem ${index + 1} de ${gallery.length}`}
                aria-pressed={index === active}
                className="grid size-6 place-items-center"
              >
                <span
                  aria-hidden="true"
                  className={cn('size-[7px] rounded-full transition-colors', index === active ? 'bg-primary' : 'bg-background/70')}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
