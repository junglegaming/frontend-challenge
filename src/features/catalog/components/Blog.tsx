/** Blog "Diário da Cunhagem": 4 cards (268×369) conforme o Figma. */
const POSTS = [
  {
    date: '12 de setembro',
    readTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    description: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/NFT-Artwork-05.webp',
  },
  {
    date: '13 de setembro',
    readTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    description: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/Frame-136.webp',
  },
  {
    date: '15 de setembro',
    readTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    description: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/NFT-Artwork-18.webp',
  },
  {
    date: '15 de setembro',
    readTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    description: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/NFT-Artwork-09.webp',
  },
] as const

/**
 * Blog "Diário da Cunhagem": 4 cards (268×369) com espaçamento de 24px
 * conforme a especificação oficial do Figma (`Blog`).
 */
export function Blog() {
  return (
    <section
      aria-labelledby="blog-title"
      className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-[40px]"
    >
      {/* Blog Section Header (1200×67) */}
      <div className="flex w-full flex-col items-center gap-[12px] text-center">
        <h2
          id="blog-title"
          className="font-mono text-[28px] leading-[37px] font-bold text-foreground"
        >
          Diário da Cunhagem
        </h2>
        <p className="font-mono text-[14px] leading-[18px] font-normal text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>

      {/* Cards: 4 colunas preenchendo os 1200px (alinhadas verticalmente com o grid do Footer) */}
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post) => (
          <article
            key={post.title}
            className="group/card flex h-[380px] w-full flex-col overflow-hidden rounded-[8px] bg-card transition-colors duration-150 hover:bg-surface-raised"
          >
            {/* Image (w-full x 195px) */}
            <div className="h-[195px] w-full shrink-0 overflow-hidden">
              <img src={post.image} alt="" className="h-full w-full object-cover" />
            </div>

            {/* Content (padding uniforme, alinhamento vertical consistente) */}
            <div className="flex flex-1 flex-col justify-between p-4">
              <div className="flex flex-col gap-2">
                {/* Date & Reading time */}
                <p className="font-mono text-[12px] leading-4 font-medium text-text-secondary">
                  {post.date} &nbsp;|&nbsp; {post.readTime}
                </p>

                {/* Title */}
                <h3 className="line-clamp-2 font-mono text-[16px] leading-[21px] font-bold text-foreground">
                  {post.title}
                </h3>

                {/* Description */}
                <p className="line-clamp-2 font-mono text-[12px] leading-[16px] font-normal text-text-secondary">
                  {post.description}
                </p>
              </div>

              {/* CTA */}
              <a
                href="#"
                className="group/cta inline-flex cursor-pointer items-center gap-1.5 pt-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="font-mono text-[12px] leading-[14px] font-bold text-highlight group-hover/cta:underline">
                  Ler mais
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="size-3.5 shrink-0 text-highlight transition-transform duration-150 group-hover/cta:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
