import { cn } from '@/shared/lib/cn'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const PROMOS = [
  {
    title: 'Lançamentos gênesis\nde edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/images/Frame-136.webp',
    imageWidth: 292,
    imageRadius: 'rounded-[18px]',
  },
  {
    title: 'Arte digital curada\ne muito mais',
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/images/NFT-Artwork-05.webp',
    imageWidth: 287,
    imageRadius: 'rounded-[17px]',
  },
] as const

/**
 * Promos: dois cards promocionais em destaque (2 × 586px × 250px, gap: 28px)
 * conforme especificação oficial do Figma (`Promos`).
 */
export function Promos() {
  function scrollToCatalog() {
    const el = document.getElementById('catalogo-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      aria-label="Destaques promocionais"
      className="mx-auto flex w-full max-w-[1200px] flex-col gap-7 lg:h-[250px] lg:flex-row lg:justify-between lg:gap-[28px]"
    >
      {PROMOS.map((promo) => (
        <article
          key={promo.title}
          className="relative flex h-[250px] w-full overflow-hidden rounded-[8px] bg-card lg:min-w-0 lg:flex-1 xl:w-[586px] xl:flex-none"
        >
          {/* Decorative Ellipses (Ellipse 7 & Ellipse 8) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[191px] top-[142px] size-[256px] rounded-full border-2 border-primary"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[199px] top-[134px] size-[256px] rounded-full border border-primary"
          />

          {/* NFT Artwork on the left */}
          <img
            src={promo.image}
            alt=""
            className={cn(
              'relative z-10 hidden h-[250px] object-cover sm:block',
              promo.imageRadius,
            )}
            style={{ width: `${promo.imageWidth}px` }}
          />

          {/* Content container on the right */}
          <div className="relative z-10 flex flex-1 flex-col items-end justify-between p-6 text-right sm:py-[32px] sm:pr-[30px] sm:pl-3">
            <h3 className="whitespace-pre-line font-mono text-[18px] leading-[24px] font-bold text-foreground">
              {promo.title}
            </h3>

            <p className="max-w-[263px] font-mono text-[14px] leading-[22px] font-normal text-text-secondary">
              {promo.description}
            </p>

            <button
              type="button"
              onClick={scrollToCatalog}
              className={cn(
                'group flex h-[40px] w-[140px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[6px] bg-primary font-mono text-[14px] leading-5 font-medium text-ink transition-colors duration-150 hover:bg-highlight',
                focusRing,
              )}
            >
              <span>Explorar</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 18 18"
                className="size-[18px] shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5" />
              </svg>
            </button>
          </div>
        </article>
      ))}
    </section>
  )
}
