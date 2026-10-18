import { ArrowRight } from "lucide-react";

const articles = [
  {
    image: "/assets/nfts/ape-dark.png",
    alt: "Macaco escuro com jaqueta clara",
    date: "12 de setembro",
    title: "Como funciona a propriedade de NFTs",
    summary: "Aprenda o essencial: registros on-chain e certificados de autenticidade.",
  },
  {
    image: "/assets/nfts/ape-green.png",
    alt: "Macaco com óculos verdes e jaqueta verde",
    date: "15 de setembro",
    title: "10 artistas digitais para acompanhar",
    summary: "Criadores emergentes que estão redefinindo a arte digital.",
  },
  {
    image: "/assets/nfts/ape-gray.png",
    alt: "Macaco com chapéu bucket e moletom roxo",
    date: "18 de setembro",
    title: "Raridade, atributos e procedência",
    summary: "Entenda raridade, procedência e o que dá valor a uma coleção.",
  },
  {
    image: "/assets/nfts/ape-gold.png",
    alt: "Macaco dourado com fones de ouvido verdes",
    date: "21 de setembro",
    title: "Como proteger sua carteira",
    summary: "Práticas simples para manter sua carteira e seus ativos seguros.",
  },
];

export function MintingDiary() {
  return (
    <section id="aprenda" aria-labelledby="minting-diary-title" className="mx-auto max-w-[1200px] px-4 xl:px-0">
      <header className="text-center">
        <h2 id="minting-diary-title" className="text-2xl font-bold text-zinc-100">
          Diário da Cunhagem
        </h2>
        <p className="mt-3 text-[11px] text-zinc-400">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <article key={article.title} className="bg-[#241612]">
            <img
              src={article.image}
              alt={article.alt}
              className="aspect-[27/20] w-full object-cover"
            />
            <div className="px-3 pt-3 pb-4">
              <p className="text-[10px] text-zinc-400">
                {article.date} <span aria-hidden="true">|</span> Leitura de 5 min
              </p>
              <h3 className="mt-2 text-sm leading-snug font-bold text-zinc-100">
                {article.title}
              </h3>
              <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">{article.summary}</p>
              <a
                href="#"
                className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#d4893f] hover:text-[#e09a52]"
              >
                Ler mais
                <ArrowRight className="size-3" aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
