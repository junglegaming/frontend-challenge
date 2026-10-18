import { ArrowRight } from "lucide-react";

const promos = [
  {
    image: "/assets/nfts/ape-green.png",
    alt: "Macaco com óculos verdes e jaqueta verde",
    title: ["Lançamentos gênesis", "de edição limitada"],
    description:
      "Colecione edições exclusivas diretamente com criadores antes da revelação pública.",
  },
  {
    image: "/assets/nfts/ape-dark.png",
    alt: "Macaco escuro com jaqueta clara",
    title: ["Arte digital selecionada", "e muito mais"],
    description:
      "Colete novos artistas, coleções verificadas e obras digitais que definem o futuro.",
  },
];

export function PromoSection() {
  return (
    <section id="criadores" aria-label="Destaques" className="mx-auto max-w-[1200px] px-4 xl:px-0">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {promos.map((promo) => (
          <article key={promo.title[0]} className="grid grid-cols-[1fr_1fr] items-center">
            <img
              src={promo.image}
              alt={promo.alt}
              className="aspect-[29/25] w-full rounded-2xl object-cover"
            />
            <div className="flex h-[78%] flex-col items-end justify-center bg-[#241612] px-5 text-right">
              <h3 className="text-xs leading-snug font-bold text-zinc-100">
                {promo.title[0]}
                <br />
                {promo.title[1]}
              </h3>
              <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">
                {promo.description}
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-[#d4893f] px-4 py-1.5 text-[11px] font-medium text-[#1a110d] hover:bg-[#e09a52]"
              >
                Explorar
                <ArrowRight className="size-3" aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
