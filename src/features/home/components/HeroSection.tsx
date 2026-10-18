import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const handleExplore = () => {
    const catalogElement = document.getElementById("catalog-section");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-[1200px] px-4 pt-4 lg:pt-8 xl:px-0">
      {/* Mobile Compact Hero Card (< lg) */}
      <div className="block lg:hidden">
        <div className="relative overflow-hidden rounded-2xl border border-[#3e2316]/60 bg-gradient-to-br from-[#452718] via-[#2a170e] to-[#1a0e08] p-4 text-xs shadow-lg">
          {/* Subtle background glow/radial effect */}
          <div className="pointer-events-none absolute -left-12 -top-12 size-40 rounded-full bg-[#d4893f]/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 size-36 rounded-full bg-[#9e5d28]/20 blur-xl" />

          <div className="relative z-10 flex items-center justify-between gap-3">
            {/* Left Column: Text & CTA */}
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-[10px] text-[#cfb7a5] font-mono">Bem-vindo à Kurio</p>

              <h1
                id="hero-title"
                className="mt-1 text-xs sm:text-sm font-bold uppercase leading-tight tracking-wider text-zinc-100"
              >
                SEJA DONO DA
                <br />
                CULTURA DIGITAL
              </h1>

              <p className="mt-1.5 text-[9px] leading-tight text-[#cfb7a5] max-w-[160px]">
                Descubra NFTs selecionados de criadores do mundo todo.
              </p>

              <button
                type="button"
                onClick={handleExplore}
                className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#e29d5b] hover:text-white transition-colors cursor-pointer"
              >
                <span>EXPLORAR</span>
                <ArrowRight className="size-3" aria-hidden="true" />
              </button>
            </div>

            {/* Right Column: Composite NFT Preview */}
            <div className="relative shrink-0 pr-1">
              {/* Primary Card */}
              <div className="overflow-hidden rounded-2xl bg-[#241612] p-1 shadow-md">
                <img
                  src="/assets/nfts/ape-green.png"
                  alt="Emerald Ape"
                  className="size-24 sm:size-28 rounded-xl object-cover"
                />
              </div>

              {/* Secondary Overlapping Thumbnail */}
              <div className="absolute -bottom-1.5 -left-3 overflow-hidden rounded-xl border-2 border-[#2a170e] bg-[#241612] p-0.5 shadow-lg">
                <img
                  src="/assets/nfts/ape-gray.png"
                  alt="Sage Nomad"
                  className="size-10 sm:size-12 rounded-lg object-cover"
                />
              </div>
            </div>
          </div>

          {/* Pagination indicator dots */}
          <div className="relative z-10 mt-3 flex justify-center items-center gap-1.5" aria-hidden="true">
            <span className="size-1.5 rounded-full bg-[#66412e]" />
            <span className="size-1.5 rounded-full bg-[#e29d5b]" />
            <span className="size-1.5 rounded-full bg-[#66412e]" />
          </div>
        </div>
      </div>

      {/* Desktop Hero Grid (>= lg) - Exact original code preserved */}
      <div className="hidden lg:grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_450px]">
        <div className="relative lg:pl-10">
          <p className="text-xs text-zinc-300">Bem-vindo à Kurio</p>

          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-wide text-zinc-100 sm:text-[44px]">
            SEJA DONO DO FUTURO
            <br />
            DA ARTE DIGITAL
          </h2>

          <p className="mt-6 max-w-[460px] text-xs leading-relaxed text-zinc-400">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e torne-se parte da
            cultura da internet.
          </p>

          <button
            type="button"
            onClick={handleExplore}
            className="mt-8 rounded-sm bg-[#d4893f] px-6 py-2 text-xs font-medium text-[#1a110d] hover:bg-[#e09a52]"
          >
            EXPLORAR
          </button>

          <div className="mt-10 flex justify-end gap-1.5 lg:mt-12" aria-hidden="true">
            <span className="size-1.5 rounded-full bg-[#d4893f]" />
            <span className="size-1.5 rounded-full bg-[#d4893f]" />
            <span className="size-1.5 rounded-full bg-[#d4893f]" />
          </div>
        </div>

        <img
          src="/assets/nfts/ape-green.png"
          alt="Macaco com óculos verdes e jaqueta college verde"
          className="aspect-[45/44] w-full max-w-[450px] justify-self-center rounded-2xl object-cover lg:justify-self-end"
        />
      </div>
    </section>
  );
}

