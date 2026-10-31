import { articles } from "./catalog/data/blog-articles";

export function BlogSection() {
  return (
    <section className="mt-24 hidden sm:block">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">
          Diário da Cunhagem
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#D4B99C] md:text-base">
          Histórias, guias e insights para colecionadores sobre o universo da
          propriedade digital.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {articles.map((article) => (
          <article
            key={article.id}
            className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[#24150F] text-[#F5EDE5]"
          >
            <a
              href={article.href}
              aria-label={`Ler artigo: ${article.title}`}
              className="block"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={article.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                />
              </div>
            </a>

            <div className="flex h-full flex-col p-4">
              <p className="text-xs leading-relaxed text-[#D4B99C]">
                {article.date}
                <span className="mx-2">|</span>
                Leitura de {article.readingTime} min
              </p>

              <h3 className="mt-3 text-base font-bold leading-snug">
                <a
                  href={article.href}
                  className="transition-colors hover:text-[#E9A568]"
                >
                  {article.title}
                </a>
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-[#D4B99C]">
                {article.description}
              </p>

              <a
                href={article.href}
                className="mt-4 inline-flex w-fit items-center gap-1 text-sm font-semibold text-[#E9A568] transition-colors hover:text-white"
              >
                Ler mais
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
