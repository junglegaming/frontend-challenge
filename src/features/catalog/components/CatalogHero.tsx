import { useCallback, useEffect, useRef, useState } from 'react';
import { Carousel, type CarouselState } from '@/components/shared/Carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import ArrowRight from '@/assets/arrow-right.svg?react';

type HeroSlide = {
  title: string;
  desktopTitle?: string;
  description: string;
  desktopDescription?: string;
  artwork: string;
  mobileArtwork?: string;
  artworkAlt: string;
  secondaryArtwork: string;
  secondaryAlt: string;
};
const slides: readonly HeroSlide[] = [
  {
    title: 'SEJA DONO DA\nCULTURA DIGITAL',
    desktopTitle: 'SEJA DONO DO FUTURO\nDA ARTE DIGITAL',
    description: 'Descubra NFTs selecionados de criadores do mundo todo.',
    desktopDescription:
      'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
    artwork: '/assets/nft/golden-signal-160.png',
    mobileArtwork: '/assets/hero/mobile-artwork-main.png',
    artworkAlt: 'Golden Signal, arte digital em destaque',
    secondaryArtwork: '/assets/hero/mobile-artwork-secondary.png',
    secondaryAlt: 'Sage Nomad',
  },
  {
    title: 'DESCUBRA NOVAS EXPRESSÕES',
    description:
      'Explore arte digital e encontre novas perspectivas para sua coleção.',
    artwork: '/assets/nft/golden-frequency-071.png',
    artworkAlt: 'Golden Frequency, arte digital em destaque',
    secondaryArtwork: '/assets/nft/violet-nomad-314.png',
    secondaryAlt: 'Violet Nomad',
  },
  {
    title: 'CRIE SUA COLEÇÃO DIGITAL',
    description: 'Encontre obras que combinam com você e comece sua coleção.',
    artwork: '/assets/nft/violet-nomad-314.png',
    artworkAlt: 'Violet Nomad, arte digital em destaque',
    secondaryArtwork: '/assets/nft/sage-nomad-009.png',
    secondaryAlt: 'Sage Nomad',
  },
];
export function CatalogHero() {
  const [autoplay] = useState(() =>
    Autoplay({
      delay: 6000,
      playOnInit: false,
      stopOnInteraction: false,
      stopOnFocusIn: false,
    })
  );
  return (
    <Carousel options={{ loop: true }} plugins={[autoplay]}>
      {(carousel) => (
        <CatalogHeroContent carousel={carousel} autoplay={autoplay} />
      )}
    </Carousel>
  );
}

function CatalogHeroContent({
  carousel,
  autoplay,
}: {
  carousel: CarouselState;
  autoplay: ReturnType<typeof Autoplay>;
}) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { viewportRef, api: embla, selected, scrollTo } = carousel;
  const [announcement, setAnnouncement] = useState('');
  const suspended = useRef({ hover: false, focus: false, dragging: false });
  const manualDrag = useRef(false);
  const syncAutoplay = useCallback(() => {
    if (
      !reducedMotion &&
      !suspended.current.hover &&
      !suspended.current.focus &&
      !suspended.current.dragging &&
      !document.hidden
    )
      autoplay.play();
    else autoplay.stop();
  }, [autoplay, reducedMotion]);
  useEffect(() => {
    if (!embla) return;
    const onReInit = () => {
      syncAutoplay();
    };
    const onDrag = () => {
      manualDrag.current = true;
      suspended.current.dragging = true;
      autoplay.stop();
    };
    const onDragEnd = () => {
      suspended.current.dragging = false;
      syncAutoplay();
    };
    const onSettle = () => {
      if (manualDrag.current) {
        manualDrag.current = false;
        const index = embla.selectedScrollSnap();
        setAnnouncement(
          `Destaque ${index + 1} de ${slides.length}: ${slides[index].title}`
        );
      }
    };
    embla
      .on('reInit', onReInit)
      .on('pointerDown', onDrag)
      .on('pointerUp', onDragEnd)
      .on('settle', onSettle);
    syncAutoplay();
    document.addEventListener('visibilitychange', syncAutoplay);
    return () => {
      embla
        .off('reInit', onReInit)
        .off('pointerDown', onDrag)
        .off('pointerUp', onDragEnd)
        .off('settle', onSettle);
      document.removeEventListener('visibilitychange', syncAutoplay);
      autoplay.stop();
    };
  }, [embla, autoplay, syncAutoplay]);
  const selectSlide = (index: number) => {
    autoplay.stop();
    const normalized = (index + slides.length) % slides.length;
    scrollTo(normalized);
    setAnnouncement(
      `Destaque ${normalized + 1} de ${slides.length}: ${slides[normalized].title}`
    );
    syncAutoplay();
  };
  return (
    <section
      aria-label="Destaques"
      aria-roledescription="carrossel"
      tabIndex={0}
      className="relative isolate overflow-hidden rounded-xl md:rounded-none"
      onMouseEnter={() => {
        suspended.current.hover = true;
        syncAutoplay();
      }}
      onMouseLeave={() => {
        suspended.current.hover = false;
        syncAutoplay();
      }}
      onFocusCapture={() => {
        suspended.current.focus = true;
        syncAutoplay();
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          suspended.current.focus = false;
          syncAutoplay();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          selectSlide(selected + (event.key === 'ArrowRight' ? 1 : -1));
        }
      }}
    >
      <img
        src="/assets/hero/mobile-background.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full md:hidden!"
        width={366}
        height={190}
      />
      <div ref={viewportRef} className="touch-pan-y overflow-hidden">
        <div className="flex">
          {slides.map((slide, index) => (
            <div
              key={slide.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${slides.length}`}
              aria-hidden={index !== selected}
              inert={index !== selected}
              className="grid h-60 min-w-0 flex-[0_0_100%] grid-cols-[minmax(0,1fr)_138px] items-center gap-2 p-4 md:h-112.5 md:grid-cols-2 md:gap-8 md:p-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,450px)] lg:gap-27.5"
            >
              <div className="min-w-0">
                <p className="text-body-medium mb-1.5 md:mb-2">
                  Bem-vindo à Kurio
                </p>
                <h2 className="text-display md:max-lg:text-display-2 mb-1.5 whitespace-pre-line md:mb-1">
                  <span className="md:hidden">{slide.title}</span>
                  <span className="hidden md:inline">
                    {slide.desktopTitle ?? slide.title}
                  </span>
                </h2>
                <p className="text-text-secondary text-body-regular max-w-139.25 md:mb-6 lg:mb-18">
                  <span className="md:hidden">{slide.description}</span>
                  <span className="hidden md:inline">
                    {slide.desktopDescription ?? slide.description}
                  </span>
                </p>
                <Button className="hidden ps-7 pe-9 md:inline-flex" asChild>
                  <a href="#catalogo">EXPLORAR</a>
                </Button>
                <a
                  className="text-caption-bold text-accent flex items-center gap-2 md:hidden"
                  href="#catalogo"
                >
                  EXPLORAR
                  <ArrowRight aria-hidden="true" />
                </a>
              </div>
              <picture className="hidden aspect-square max-h-112.5 w-full md:block">
                <img
                  src={slide.artwork}
                  alt={slide.artworkAlt}
                  className="size-full rounded-2xl object-cover"
                  width={450}
                  height={450}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                />
              </picture>
              <div className="relative h-36.5 w-34.5 md:hidden">
                <img
                  src={slide.mobileArtwork ?? slide.artwork}
                  alt={slide.artworkAlt}
                  className="size-34.5 rounded-lg object-cover"
                  width={138}
                  height={138}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                />
                <img
                  src={slide.secondaryArtwork}
                  alt={slide.secondaryAlt}
                  className="absolute top-22 left-3.5 size-14.5 rounded-lg object-cover"
                  width={58}
                  height={58}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="relative mx-auto mb-4 flex h-1.75 w-8.25 justify-between md:absolute md:right-[calc(50%+16px)] md:bottom-10.75 md:m-0 md:h-2 md:w-10 lg:right-140"
        aria-label="Controles dos destaques"
      >
        <img
          src="/assets/hero/mobile-pagination.svg"
          alt=""
          aria-hidden="true"
          width={33}
          height={7}
          className="pointer-events-none absolute inset-0 opacity-40 md:hidden!"
        />
        <img
          src="/assets/hero/desktop-pagination.svg"
          alt=""
          aria-hidden="true"
          width={40}
          height={8}
          className="pointer-events-none absolute inset-0 hidden! opacity-40 md:block!"
        />
        <img
          src="/assets/hero/mobile-pagination.svg"
          alt=""
          aria-hidden="true"
          width={33}
          height={7}
          className="pointer-events-none absolute inset-0 md:hidden!"
          style={{
            clipPath: `inset(0 ${26 - selected * 13}px 0 ${selected * 13}px)`,
          }}
        />
        <img
          src="/assets/hero/desktop-pagination.svg"
          alt=""
          aria-hidden="true"
          width={40}
          height={8}
          className="pointer-events-none absolute inset-0 hidden! md:block!"
          style={{
            clipPath: `inset(0 ${32 - selected * 16}px 0 ${selected * 16}px)`,
          }}
        />
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Ir para destaque ${index + 1}`}
            aria-current={selected === index ? 'true' : undefined}
            className="relative size-1.75 cursor-pointer rounded-full before:absolute before:-inset-x-0.75 before:-inset-y-4.5 md:size-2 md:before:-inset-x-1"
            onClick={() => selectSlide(index)}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  );
}
