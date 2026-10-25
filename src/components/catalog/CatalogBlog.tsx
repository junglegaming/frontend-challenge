import { ArrowRight } from 'lucide-react'
import { ComingSoon } from '@/components/common/ComingSoon'
import { nftImageProps } from '@/lib/images'

const POSTS = [
  {
    id: 'property',
    image: 'ivory-baron' as const,
    meta: '12 de setembro | Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    id: 'artists',
    image: 'emerald-ape' as const,
    meta: '13 de setembro | Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    description: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    id: 'rarity',
    image: 'sage-nomad' as const,
    meta: '15 de setembro | Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    description: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    id: 'wallet',
    image: 'golden-beat' as const,
    meta: '15 de setembro | Leitura de 2 min',
    title: 'Como proteger sua carteira',
    description: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
]

export function CatalogBlog() {
  return (
    <section aria-labelledby="blog-title" className="mt-16 md:mt-24">
      <div className="text-center">
        <h2 id="blog-title" className="text-2xl leading-[37px] font-bold">
          Diário da Cunhagem
        </h2>
        <p className="mx-auto mt-3 max-w-[720px] text-xs leading-[18px] text-muted-foreground">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(4,268px)] xl:justify-start">
        {POSTS.map((post) => (
          <article key={post.id} className="flex flex-col overflow-hidden bg-card">
            <img
              {...nftImageProps(post.image, '(min-width: 1280px) 268px, (min-width: 640px) 45vw, 90vw')}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-[268/195] w-full object-cover"
            />
            <div className="flex min-h-[174px] flex-1 flex-col gap-1.5 p-4">
              <p className="min-h-8 text-xs leading-4 text-muted-foreground">{post.meta}</p>
              <h3 className="text-sm leading-[21px] font-bold">{post.title}</h3>
              <p className="text-xs leading-4 text-muted-foreground">{post.description}</p>
              <ComingSoon className="mt-auto inline-flex items-center gap-2 pt-2 text-xs font-bold text-accent-text opacity-100">
                Ler mais
                <ArrowRight className="size-3" aria-hidden="true" />
              </ComingSoon>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
