const benefits = [
  {
    letter: "W",
    title: "Segurança da carteira",
    description: "Proteja sua carteira e colecione arte digital com mais confiança.",
  },
  {
    letter: "C",
    title: "Criadores em destaque",
    description: "Explore artistas, coleções e lançamentos que moldam a cultura digital da Kurio.",
  },
  {
    letter: "D",
    title: "Alertas de lançamentos",
    description: "Receba calendários de cunhagem, novidades e listas de acesso antecipado.",
  },
];

export function TrustSection() {
  return (
    <section aria-label="Benefícios e newsletter" className="bg-[#241612]">
      <div className="grid grid-cols-1 gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:px-0">
        {benefits.map((benefit) => (
          <div key={benefit.title} className="lg:border-r lg:border-[#6b4127] lg:px-8">
            <span
              className="flex size-10 items-center justify-center rounded-full bg-[#d4893f] text-sm font-bold text-[#1a110d]"
              aria-hidden="true"
            >
              {benefit.letter}
            </span>
            <h3 className="mt-4 text-xs font-bold text-zinc-100">{benefit.title}</h3>
            <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">{benefit.description}</p>
          </div>
        ))}

        <div className="lg:px-8">
          <h3 className="text-xs font-bold text-zinc-100">Antecipe-se ao próximo lançamento</h3>
          <form className="mt-3 flex" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="newsletter-email" className="sr-only">
              E-mail
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Digite seu e-mail"
              className="min-w-0 flex-1 border border-[#4a3226] bg-[#1a110d] px-2 py-1.5 text-[10px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-[#d4893f] px-3 text-[11px] font-medium text-[#1a110d] hover:bg-[#e09a52]"
            >
              Enviar
            </button>
          </form>
          <p className="mt-3 text-[10px] leading-relaxed text-zinc-400">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </div>
      </div>
    </section>
  );
}
