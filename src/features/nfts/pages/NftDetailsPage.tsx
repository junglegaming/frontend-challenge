import type { ReactNode } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { isAxiosError } from "axios";
import { useNft } from "@/features/nfts/queries";
import { Header } from "@/features/home/components/Header";
import { TrustSection } from "@/features/home/components/TrustSection";
import { Footer } from "@/features/home/components/Footer";
import { NftGallery } from "@/features/nfts/components/NftGallery";
import { NftPurchasePanel } from "@/features/nfts/components/NftPurchasePanel";
import { NftDetailsTabs } from "@/features/nfts/components/NftDetailsTabs";
import { MoreFromCollection } from "@/features/nfts/components/MoreFromCollection";
import { MobileNftDetails } from "@/features/nfts/components/MobileNftDetails";

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#1a110d] font-mono text-zinc-100">
      <div className="hidden lg:block">
        <Header />
      </div>
      <main className="mx-auto max-w-[1200px] px-0 lg:px-4 pt-0 lg:pt-6 xl:px-0">{children}</main>
      <div className="hidden lg:block mx-auto mt-24 max-w-[1200px] px-4 pb-6 xl:px-0">
        <TrustSection />
        <Footer />
      </div>
    </div>
  );
}

function StatusMessage({ children, role }: { children: ReactNode; role: "status" | "alert" }) {
  return (
    <div role={role} className="py-24 text-center text-xs text-zinc-400">
      {children}
      <Link to="/" className="mt-4 block text-[#d4893f] hover:text-[#e09a52]">
        Voltar para o início
      </Link>
    </div>
  );
}

export function NftDetailsPage() {
  const { nftId } = useParams({
    from: "/nfts/$nftId",
  });

  const { data: nft, isLoading, isError, error } = useNft(nftId);

  if (isLoading) {
    return (
      <PageShell>
        <p role="status" className="py-24 text-center text-xs text-zinc-400">
          Carregando NFT...
        </p>
      </PageShell>
    );
  }

  const isNotFound = isError && isAxiosError(error) && error.response?.status === 404;

  if (isError && !isNotFound) {
    return (
      <PageShell>
        <StatusMessage role="alert">Erro ao carregar os detalhes do NFT.</StatusMessage>
      </PageShell>
    );
  }

  if (isNotFound || !nft) {
    return (
      <PageShell>
        <StatusMessage role="status">NFT não encontrado.</StatusMessage>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Mobile View (< lg) */}
      <MobileNftDetails nft={nft} />

      {/* Desktop View (>= lg) */}
      <div className="hidden lg:block">
        <nav aria-label="Breadcrumb" className="text-[11px] text-zinc-100">
          <ol className="flex items-center gap-1">
            <li>
              <Link to="/" className="hover:text-[#d4893f]">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Mercado</li>
          </ol>
        </nav>

        <section
          aria-label={`Detalhes de ${nft.name}`}
          className="mt-3 grid grid-cols-1 gap-8 lg:grid-cols-[570px_1fr]"
        >
          <NftGallery nft={nft} />
          <NftPurchasePanel nft={nft} />
        </section>

        <div className="mt-16">
          <NftDetailsTabs nft={nft} />
        </div>

        <div className="mt-20">
          <MoreFromCollection currentNftId={nft.id} />
        </div>
      </div>
    </PageShell>
  );
}