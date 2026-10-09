import { useCallback, useSyncExternalStore, type ReactNode } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

export type CarouselState = {
  viewportRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  selected: number;
  snapCount: number;
  scrollTo: (index: number) => void;
};

// Owns dragging and selection; each consumer keeps its markup and indicators.
export function Carousel({
  options,
  plugins,
  children,
}: {
  options?: Parameters<typeof useEmblaCarousel>[0];
  plugins?: Parameters<typeof useEmblaCarousel>[1];
  children: (carousel: CarouselState) => ReactNode;
}) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [viewportRef, api] = useEmblaCarousel(
    { ...options, duration: reducedMotion ? 0 : (options?.duration ?? 25) },
    plugins
  );
  const subscribe = useCallback(
    (notify: () => void) => {
      api?.on('select', notify).on('reInit', notify);
      return () => {
        api?.off('select', notify).off('reInit', notify);
      };
    },
    [api]
  );
  const selected = useSyncExternalStore(
    subscribe,
    () => api?.selectedScrollSnap() ?? 0,
    () => 0
  );
  const snapCount = useSyncExternalStore(
    subscribe,
    () => api?.scrollSnapList().length ?? 0,
    () => 0
  );
  const scrollTo = useCallback(
    (index: number) => api?.scrollTo(index, reducedMotion),
    [api, reducedMotion]
  );
  return children({ viewportRef, api, selected, snapCount, scrollTo });
}
