import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import type { Nft } from '@/types/api';
import { NFTCard } from '@/components/shared/NFTCard';
import { NFTCardSkeleton } from '@/components/shared/NFTCardSkeleton';
import { Carousel, type CarouselState } from '@/components/shared/Carousel';
import { ErrorState } from '@/components/shared/ErrorState';

export function NftRecommendationsSection({
  title,
  items,
  isPending,
  isError,
  onRetry,
  emptyMessage,
  errorMessage,
}: {
  title: string;
  items: Nft[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  emptyMessage: string;
  errorMessage: string;
}) {
  const desktop = useMediaQuery('(min-width: 64rem)');
  const tablet = useMediaQuery('(min-width: 48rem)');
  const pageSize = desktop ? 5 : tablet ? 3 : 2;
  return (
    <section aria-label={title}>
      <h2 className="border-border text-text-accent text-body-17-bold mb-8 border-b pb-3">
        {title}
      </h2>
      {isPending ? (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: pageSize }, (_, i) => (
            <NFTCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title={errorMessage} onRetry={onRetry} />
      ) : items.length ? (
        <Carousel options={{ align: 'start', containScroll: false }}>
          {(carousel) => (
            <RecommendationsCarousel
              items={items}
              carousel={carousel}
              pageSize={pageSize}
            />
          )}
        </Carousel>
      ) : (
        <p className="text-text-secondary">{emptyMessage}</p>
      )}
    </section>
  );
}

function RecommendationsCarousel({
  items,
  carousel,
  pageSize,
}: {
  items: Nft[];
  carousel: CarouselState;
  pageSize: number;
}) {
  const { viewportRef, selected, snapCount, scrollTo } = carousel;
  const pageCount = Math.ceil(items.length / pageSize);
  return (
    <div
      role="region"
      aria-label="NFTs recomendados"
      aria-roledescription="carrossel"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? pageCount - 1
                : selected + (event.key === 'ArrowRight' ? 1 : -1);
          scrollTo(Math.max(0, Math.min(pageCount - 1, next)));
        }
      }}
    >
      <div
        ref={viewportRef}
        className="touch-pan-y overflow-hidden"
        onFocusCapture={(event) => {
          const page = (event.target as HTMLElement).closest<HTMLElement>(
            '[data-carousel-page]'
          );
          if (page) scrollTo(Number(page.dataset.carouselPage));
        }}
      >
        <div className="flex gap-6">
          {Array.from({ length: pageCount }, (_, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`Página ${i + 1} de ${pageCount}`}
              data-carousel-page={i}
              aria-hidden={i !== selected}
              inert={i !== selected}
              className="grid min-w-0 shrink-0 grow-0 basis-full grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5"

              onDragStart={(event) => event.preventDefault()}
            >
              {items.slice(i * pageSize, (i + 1) * pageSize).map((item) => (
                <NFTCard key={item.id} nft={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {pageCount > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: snapCount || pageCount }, (_, i) => (
            <button
              type="button"
              key={i}
              aria-label={`Ver página ${i + 1} de recomendações`}
              aria-pressed={selected === i}
              onClick={() => scrollTo(i)}
              className={`border-primary size-2 rounded-full border ${selected === i ? 'bg-primary' : ''}`}
            />
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Página {selected + 1} de {pageCount} de recomendações.
      </p>
    </div>
  );
}
