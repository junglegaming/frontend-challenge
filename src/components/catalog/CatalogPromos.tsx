import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { nftImageProps } from '@/lib/images'
import { scrollToCatalog } from './scrollToCatalog'

const PROMOS = [
  {
    id: 'genesis',
    image: 'emerald-ape' as const,
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
  },
  {
    id: 'curated',
    image: 'ivory-baron' as const,
    title: 'Arte digital selecionada e muito mais',
    description: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
  },
]

export function CatalogPromos() {
  return (
    <section aria-labelledby="promos-title" className="mt-16 md:mt-24">
      <h2 id="promos-title" className="sr-only">
        Promoções
      </h2>
      <div className="grid gap-7 sm:grid-cols-2">
        {PROMOS.map((promo) => (
          <article key={promo.id} className="flex overflow-hidden bg-card sm:h-[250px]">
            <img
              {...nftImageProps(promo.image, '(min-width: 640px) 292px, 40vw')}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-[38%] shrink-0 object-cover sm:h-full sm:w-[49.8%]"
            />
            <div className="flex min-w-0 flex-1 flex-col items-end pt-6 pr-[30px] pb-6 text-right sm:pt-[37px]">
              <h3 className="max-w-[206px] text-sm leading-6 font-bold sm:text-base">{promo.title}</h3>
              <p className="mt-2.5 text-xs leading-[15px] text-muted-foreground">{promo.description}</p>
              <Button
                size="sm"
                onClick={scrollToCatalog}
                aria-label={`Explorar: ${promo.title}`}
                className="mt-6 h-10 w-[140px] text-sm"
              >
                Explorar
                <ArrowRight className="size-[18px]" aria-hidden="true" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
