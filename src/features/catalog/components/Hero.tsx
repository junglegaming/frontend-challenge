import { useState } from 'react'

import { ArrowRight } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

interface HeroSlide {
  id: string
  tag: string
  desktopTitle: string
  desktopDescription: string
  mobileTag: string
  mobileTitle: string
  mobileDescription: string
  desktopImage: string
  desktopAlt: string
  mobileMainImage: string
  mobileMainAlt: string
  mobileSecondaryImage: string
  mobileSecondaryAlt: string
}

const HERO_SLIDES: readonly HeroSlide[] = [
  {
    id: 'slide-emerald',
    tag: 'Bem-vindo à Kurio',
    desktopTitle: 'SEJA DONO DO FUTURO\nDA ARTE DIGITAL',
    desktopDescription:
      'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
    mobileTag: 'Bem-vindo à Kurio',
    mobileTitle: 'SEJA DONO DA\nCULTURA DIGITAL',
    mobileDescription: 'Descubra NFTs selecionados de criadores do mundo todo.',
    desktopImage: '/images/Frame-136.webp',
    desktopAlt: 'Obra digital em destaque da coleção Kurio: Emerald Ape #042 por Nova Sato',
    mobileMainImage: '/images/Frame-136.webp',
    mobileMainAlt: 'Emerald Ape #042 por Nova Sato',
    mobileSecondaryImage: '/images/NFT-Artwork-18.webp',
    mobileSecondaryAlt: 'Sage Nomad por Aisha Thorne',
  },
  {
    id: 'slide-nomad',
    tag: 'Criadores em destaque',
    desktopTitle: 'COLECIONE OBRAS\nDE ARTISTAS ÚNICOS',
    desktopDescription:
      'Aisha Thorne traz coleções conceituais de arte generativa e figurativa. Conheça criadores independentes que moldam a cultura na blockchain.',
    mobileTag: 'Criadores em destaque',
    mobileTitle: 'CRIADORES EM\nDESTAQUE',
    mobileDescription: 'Conheça Aisha Thorne e criadores da cultura digital.',
    desktopImage: '/images/NFT-Artwork-18.webp',
    desktopAlt: 'Obra digital em destaque da coleção Kurio: Sage Nomad por Aisha Thorne',
    mobileMainImage: '/images/NFT-Artwork-18.webp',
    mobileMainAlt: 'Sage Nomad por Aisha Thorne',
    mobileSecondaryImage: '/images/NFT-Artwork-09.webp',
    mobileSecondaryAlt: 'Solace in Motion por Kaelen Voss',
  },
  {
    id: 'slide-motion',
    tag: 'Lançamentos selecionados',
    desktopTitle: 'ARTE DIGITAL RARA\nE VERIFICADA',
    desktopDescription:
      'Kaelen Voss e estúdios parceiros com lançamentos verificados na rede Ethereum. Colecionismo autêntico com procedência e direitos autorais garantidos.',
    mobileTag: 'Lançamentos selecionados',
    mobileTitle: 'EDIÇÕES RARAS\nVERIFICADAS',
    mobileDescription: 'Obras verificadas com procedência na rede Ethereum.',
    desktopImage: '/images/NFT-Artwork-09.webp',
    desktopAlt: 'Obra digital em destaque da coleção Kurio: Solace in Motion por Kaelen Voss',
    mobileMainImage: '/images/NFT-Artwork-09.webp',
    mobileMainAlt: 'Solace in Motion por Kaelen Voss',
    mobileSecondaryImage: '/images/NFT-Artwork-05.webp',
    mobileSecondaryAlt: 'Neon Drift por Marcus Vance',
  },
]

const DEFAULT_SLIDE: HeroSlide = HERO_SLIDES[0]!

/**
 * Hero da Início:
 * - Desktop: layout 1200px com headline expandida e Frame-136 em 450px
 * - Mobile: banner 366px x 190px com artes sobrepostas e texto compacto fiel ao Figma
 * - Bolinhas (elipses) interativas para alternar as obras/criadores em destaque
 *
 * @returns Seção hero da página inicial.
 */
export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const slide: HeroSlide = HERO_SLIDES[currentSlide] ?? DEFAULT_SLIDE

  function scrollToCatalog() {
    const el = document.getElementById('catalogo-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
    }
  }

  return (
    <>
      {/* Mobile Hero Banner: 366px x 190px (Figma Mobile / Início) */}
      <section
        aria-labelledby="mobile-hero-title"
        className="relative mx-auto flex h-[190px] w-full max-w-[366px] flex-col justify-between overflow-hidden rounded-[30px] border border-[#D28A4C]/20 p-4 shadow-[0px_4px_24px_rgba(10,6,4,0.6)] md:hidden"
        style={{
          background:
            'linear-gradient(104.74deg, rgba(210, 138, 76, 0.22) 1.08%, rgba(210, 138, 76, 0.08) 99.23%), #18100C',
        }}
      >
        {/* Glow Ellipses */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 -left-16 size-48 rounded-full blur-2xl"
          style={{
            background:
              'radial-gradient(circle, rgba(221,154,95,0.45) 0%, rgba(210,138,76,0.05) 70%, transparent 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-4 left-20 size-48 rounded-full blur-2xl"
          style={{
            background:
              'radial-gradient(circle, rgba(221,154,95,0.38) 0%, rgba(210,138,76,0) 70%, transparent 100%)',
          }}
        />

        {/* Content Row: Text (left) + Stacked Artworks (right) */}
        <div className="relative z-10 flex items-start justify-between gap-2">
          {/* Frame 405 */}
          <div className="flex w-[190px] shrink-0 flex-col gap-1 transition-opacity duration-200">
            <span className="font-mono text-[12px] leading-4 font-medium text-[#F5F1EB]">
              {slide.mobileTag}
            </span>
            <h1
              id="mobile-hero-title"
              className="font-mono text-[18px] leading-[22px] font-bold tracking-tight text-[#F5F1EB]"
            >
              {slide.mobileTitle}
            </h1>
            <p className="mt-0.5 font-mono text-[12px] leading-[15px] font-normal text-[#CFB28C]">
              {slide.mobileDescription}
            </p>
            <button
              type="button"
              onClick={scrollToCatalog}
              className="mt-1 flex items-center gap-1 font-mono text-[12px] leading-[14px] font-bold text-[#E89B55] transition-opacity hover:opacity-85"
            >
              EXPLORAR
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Group 105: Stacked Artworks */}
          <div className="relative flex size-[138px] shrink-0 items-center justify-end">
            <img
              src={slide.mobileMainImage}
              alt={slide.mobileMainAlt}
              width={134}
              height={134}
              className="size-[134px] rounded-[16px] border border-[#D28A4C]/30 object-cover shadow-md transition-all duration-300"
            />
            <img
              src={slide.mobileSecondaryImage}
              alt={slide.mobileSecondaryAlt}
              width={58}
              height={58}
              className="absolute -bottom-1 -left-2 size-[58px] rounded-[16px] border-2 border-[#140D0A] object-cover shadow-xl transition-all duration-300"
            />
          </div>
        </div>

        {/* Frame 4: 3 dots (elipses) */}
        <div
          role="tablist"
          aria-label="Carrossel de criadores em destaque"
          onKeyDown={handleKeyDown}
          className="relative z-10 flex items-center justify-center gap-1.5 pt-2"
        >
          {HERO_SLIDES.map((item, idx) => {
            const isActive = currentSlide === idx
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Slide ${idx + 1} de ${HERO_SLIDES.length}: ${item.mobileTag}`}
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  'size-[7px] cursor-pointer rounded-full transition-all duration-200 focus:outline-none',
                  isActive ? 'bg-[#D28A4C]' : 'bg-[#D28A4C]/40 hover:bg-[#D28A4C]/80',
                )}
              />
            )
          })}
        </div>
      </section>

      {/* Desktop Hero: 1200px width */}
      <section
        aria-labelledby="hero-title"
        className="mt-8 hidden h-[450px] w-full items-center justify-between gap-10 pl-0 md:flex lg:pl-10 xl:gap-[110px]"
      >
        {/* Frame 135: 600px width, 44px gap */}
        <div className="flex w-full max-w-[600px] flex-col gap-[44px] xl:w-[600px]">
          {/* Frame 134: 32px gap */}
          <div className="flex w-full flex-col gap-8">
            {/* Frame 133: 4px gap */}
            <div className="flex flex-col gap-1 transition-opacity duration-200">
              {/* Frame 132: 8px gap */}
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[14px] leading-4 font-medium tracking-[0.1em] text-foreground">
                  {slide.tag}
                </p>
                <h1
                  id="hero-title"
                  className="font-mono text-[43px] leading-[70px] font-bold whitespace-pre-line text-foreground"
                >
                  {slide.desktopTitle}
                </h1>
              </div>
              <p className="max-w-[557px] font-mono text-[14px] leading-6 font-normal text-text-secondary">
                {slide.desktopDescription}
              </p>
            </div>

            {/* Frame 131: 140px x 40px EXPLORAR button */}
            <button
              type="button"
              onClick={scrollToCatalog}
              className="flex h-[40px] w-[140px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] bg-primary font-mono text-[16px] leading-5 font-bold text-ink transition-colors duration-150 hover:bg-highlight"
            >
              EXPLORAR
            </button>
          </div>

          {/* Group 4: 40px width, 3 dots of 8px (Ellipse 2, Ellipse 3, Ellipse 4) */}
          <div
            role="tablist"
            aria-label="Carrossel de criadores em destaque"
            onKeyDown={handleKeyDown}
            className="flex w-10 gap-2 self-end"
          >
            {HERO_SLIDES.map((item, idx) => {
              const isActive = currentSlide === idx
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Slide ${idx + 1} de ${HERO_SLIDES.length}: ${item.tag}`}
                  onClick={() => setCurrentSlide(idx)}
                  className={cn(
                    'size-2 cursor-pointer rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    isActive ? 'bg-primary' : 'bg-primary/60 hover:bg-primary/90',
                  )}
                />
              )
            })}
          </div>
        </div>

        {/* Frame 136: 450px x 450px, border-radius 24px */}
        <img
          src={slide.desktopImage}
          alt={slide.desktopAlt}
          width={450}
          height={450}
          fetchPriority="high"
          className="hidden size-[280px] shrink-0 rounded-[24px] object-cover transition-all duration-300 md:block lg:size-[400px] xl:size-[450px]"
        />
      </section>
    </>
  )
}
