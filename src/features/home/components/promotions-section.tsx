import { ArrowRight } from "lucide-react";
import { promotions } from "./catalog/data/promotions";

export function PromotionsSection() {
  return (
    <section className="mt-16 hidden sm:block">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {promotions.map((promotion) => (
          <article
            key={promotion.id}
            className="grid overflow-hidden rounded-xl border border-[var(--color-border)] bg-[#24150F] text-[#F5EDE5] sm:grid-cols-2"
          >
            <div className="min-h-56 overflow-hidden sm:min-h-64">
              <img
                src={promotion.image}
                alt=""
                loading="lazy"
                className="h-full min-h-56 w-full object-cover transition-transform duration-300 ease-in-out hover:scale-105 sm:min-h-64"
              />
            </div>

            <div className="flex flex-col items-center justify-center p-6 text-center">
              <h3 className="text-lg font-bold leading-snug">
                {promotion.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#D4B99C]">
                {promotion.description}
              </p>

              <a
                href={promotion.href}
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#D88D4B] px-5 py-2.5 text-sm font-semibold text-[#24150F] transition-colors hover:bg-[#E9A568]"
              >
                Explorar
                <ArrowRight size={16} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
