import { useId, useState } from 'react'
import { Search } from 'lucide-react'
import { nftImageProps } from '@/lib/images'
import type { Nft } from '@/schemas/nft'

interface NftGalleryProps {
  nft: Nft
}

export function NftGallery({ nft }: NftGalleryProps) {
  const hintId = useId()
  const gallery = nft.gallery.length > 0 ? nft.gallery : [nft.image]
  const [active, setActive] = useState(0)
  const current = gallery[Math.min(active, gallery.length - 1)] ?? nft.image

  const move = (delta: number) => {
    setActive((currentIndex) => (currentIndex + delta + gallery.length) % gallery.length)
  }

  return (
    <section
      aria-label="Galeria do NFT"
      aria-roledescription="galeria de imagens"
      aria-describedby={hintId}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          move(-1)
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          move(1)
        }
      }}
      className="hidden items-start gap-7 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:grid md:grid-cols-[100px_minmax(0,1fr)]"
    >
      <p id={hintId} className="sr-only">
        Use as setas esquerda e direita para trocar a imagem.
      </p>
      <div className="flex flex-col gap-4">
        {gallery.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            aria-pressed={index === active}
            aria-label={`Ver imagem ${index + 1} de ${gallery.length}`}
            onClick={() => setActive(index)}
            className="w-[100px] overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <img
              {...nftImageProps(image, '100px')}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-square w-full object-cover"
            />
          </button>
        ))}
      </div>

      <div className="relative self-start rounded-xl bg-card p-5">
        <img
          {...nftImageProps(current, '(min-width: 1024px) 404px, 40vw')}
          alt={`Arte do NFT ${nft.name}, imagem ${active + 1} de ${gallery.length}`}
          fetchPriority="high"
          className="aspect-square w-full rounded-lg object-cover"
        />
        <span
          aria-hidden="true"
          className="absolute top-[15px] right-[13px] grid size-[30px] place-items-center rounded-full bg-background/60 text-foreground"
        >
          <Search className="size-5" />
        </span>
      </div>
    </section>
  )
}
