import { footerBenefits } from "./data/footer-benefits";

export function FooterTop() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      {footerBenefits.map((benefit, index) => (
        <article
          key={benefit.letter}
          className={`min-w-0 px-5 py-6 xl:py-5 ${
            index > 0
              ? "border-t border-[#9B6239] xl:border-l xl:border-t-0"
              : ""
          }`}
        >
          <span className="mb-3 inline-flex size-[74px] items-center justify-center rounded-full bg-[#D88D4B] text-2xl font-bold text-[#24150F]">
            {benefit.letter}
          </span>

          <h2 className="font-bold leading-snug text-[#F5EDE5]">
            {benefit.title}
          </h2>

          <p className="mt-2 text-sm leading-[1.6] text-[#D4B99C]">
            {benefit.description}
          </p>
        </article>
      ))}

      <section className="border-t border-[#9B6239] px-5 py-6 xl:border-l xl:border-t-0 xl:py-5">
        <h2 className="font-bold leading-tight text-[#F5EDE5]">
          Antecipe-se ao próximo lançamento
        </h2>

        <form
          className="mt-3 flex w-full overflow-hidden rounded-md bg-[#3A2414]"
          onSubmit={(event) => event.preventDefault()}
        >
          <label htmlFor="footer-email" className="sr-only">
            Seu e-mail
          </label>
          <input
            id="footer-email"
            type="email"
            name="email"
            placeholder="Digite seu e-mail..."
            autoComplete="email"
            required
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[10px] text-[#F5EDE5] outline-none placeholder:text-[12px] placeholder:text-[#B99A70] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#D88D4B]"
          />

          <button
            type="submit"
            className="shrink-0 bg-[#D88D4B] px-4 text-[12px] text-[#24150F] transition-colors hover:bg-[#E9A568] cursor-pointer"
          >
            Enviar
          </button>
        </form>

        <p className="mt-3 text-sm leading-[1.6] text-[#D4B99C]">
          Receba lançamentos selecionados, histórias de criadores e novidades do
          mercado.
        </p>
      </section>
    </div>
  );
}
