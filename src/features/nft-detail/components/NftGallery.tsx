import { lazy, Suspense, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import Search from '@/assets/nft-detail/zoom.svg?react';
import type { Nft } from '@/types/api';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { cn } from '@/lib/utils';

const GalleryDialog = lazy(() => import('./GalleryDialog'));

export function NftGallery({
  nft,
  selected,
  pending,
  onFavorite,
}: {
  nft: Nft;
  selected: boolean;
  pending: boolean;
  onFavorite: () => void;
}) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const expandButton = useRef<HTMLButtonElement>(null);
  const image = nft.images[active] ?? nft.image;
  return (
    <section
      aria-label="Galeria do NFT"
      className="from-surface-card to-surface-raised relative bg-linear-to-br px-7 pt-6 md:flex md:gap-7 md:bg-none md:p-0"
    >
      <div className="mb-2 flex items-center justify-between md:hidden">
        <Link
          to="/"
          search={{ sort: 'relevance', page: 1 }}
          aria-label="Voltar ao catálogo"
          className="bg-surface-raised border-border flex size-9 items-center justify-center rounded-full border"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <FavoriteButton
          selected={selected}
          pending={pending}
          onClick={onFavorite}
          compact
        />
      </div>
      <div className="hidden w-20 shrink-0 flex-col gap-4 md:flex xl:w-25">
        {nft.images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Ver imagem ${index + 1}`}
            aria-pressed={active === index}
            className={cn(
              'bg-surface-card aspect-square w-full overflow-hidden rounded-lg border',
              active === index ? 'border-primary' : 'border-transparent'
            )}
          >
            <img
              src={src}
              alt=""
              className="size-full object-cover"
              width={100}
              height={100}
            />
          </button>
        ))}
      </div>
      <div className="bg-surface-card md:rounded-default relative aspect-361/356 w-full rounded-3xl md:aspect-square md:max-w-111 md:p-5 xl:size-111 xl:shrink-0">
        <img
          src={image}
          alt={`${nft.name}, imagem ${active + 1}`}
          width={404}
          height={404}
          className="size-full rounded-3xl object-cover"
          fetchPriority="high"
        />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Ampliar imagem"
          ref={expandButton}
          className="bg-surface-card/80 absolute top-3 right-3 flex size-8 items-center justify-center rounded-full"
        >
          <Search className="size-5" />
        </button>
        {nft.rarity && (
          <span className="bg-ink/85 text-text-accent absolute top-3 left-3 rounded-full px-2 py-1 text-xs md:top-auto md:bottom-6 md:left-6">
            {nft.rarity}
          </span>
        )}
      </div>
      {nft.images.length > 1 && (
        <div
          className="bg-ink/60 absolute bottom-9 left-1/2 flex -translate-x-1/2 justify-center gap-1 rounded-full px-1 md:hidden"
          aria-label="Imagens da galeria"
        >
          {nft.images.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ver imagem ${index + 1}`}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
              className="flex size-6 items-center justify-center"
            >
              <span
                className={cn(
                  'border-primary size-1.75 rounded-full border',
                  active === index && 'bg-primary'
                )}
              />
            </button>
          ))}
        </div>
      )}
      {expanded && (
        <Suspense
          fallback={
            <p role="status" className="sr-only">
              Abrindo imagem
            </p>
          }
        >
          <GalleryDialog
            image={image}
            name={nft.name}
            onClose={() => setExpanded(false)}
            onRestoreFocus={() => expandButton.current?.focus()}
          />
        </Suspense>
      )}
    </section>
  );
}
