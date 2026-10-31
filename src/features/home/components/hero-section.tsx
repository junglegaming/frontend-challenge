import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { nfts } from "../../../data/nfts";

export function HeroSection() {
  const featuredNFT = nfts[0];

  if (!featuredNFT) return null;

  return (
    <section className="w-full min-w-0 py-3 sm:py-8 lg:py-16">
      {/* Mobile */}
      <div className="overflow-hidden rounded-xl border border-[#70452f]/50 bg-[#925b3b] shadow-sm lg:hidden">
        <div className="grid min-h-[210px] grid-cols-[1fr_0.85fr] sm:min-h-[270px]">
          <div className="flex min-w-0 flex-col justify-center p-3 sm:p-6">
            <h1 className="text-lg font-extrabold uppercase leading-[1.15] tracking-tight text-[#ffffff] sm:text-2xl">
              Seja dono do futuro da arte digital
            </h1>

            <p className="mt-2 font-bold text-[11px] leading-[1.6] text-[#38251b] sm:text-sm">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>

            <Link
              to="/market"
              className="group mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-[#f5dfca]"
            >
              Explorar
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <Link
            to="/nfts/$nftId"
            params={{ nftId: featuredNFT.id }}
            className="group relative m-2 min-w-0 overflow-hidden rounded-lg"
          >
            <img
              src={featuredNFT.image}
              alt={featuredNFT.name}
              fetchPriority="high"
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#241611]/25 to-transparent" />
          </Link>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden min-w-0 items-center gap-8 lg:grid lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0">
          <p className="mb-4 text-sm tracking-wider text-foreground">
            Bem-vindo à Kurio
          </p>

          <h1 className="max-w-xl text-4xl font-black uppercase leading-tight tracking-tight text-foreground xl:text-5xl">
            Seja dono do futuro da arte digital
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-muted">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            Colecione arte digital rara, apoie artistas e tenha uma parte da
            cultura da internet.
          </p>

          <Link
            to="/market"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            EXPLORAR
          </Link>
        </div>

        <Link
          to="/nfts/$nftId"
          params={{ nftId: featuredNFT.id }}
          className="group relative mx-auto block w-full min-w-0 max-w-[450px] overflow-hidden rounded-card bg-surface lg:mx-0 lg:justify-self-end"
        >
          <img
            src={featuredNFT.image}
            alt={featuredNFT.name}
            fetchPriority="high"
            className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      </div>
    </section>
  );
}
