import { AppFooter } from "@/components/layout/app-footer";
import { nfts } from "@/data/nfts";
import { MarketPage } from "@/features/market";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const marketSearchSchema = z.object({
  nftId: z.string().optional(),
  category: z.string().optional(),
  view: z.enum(["market", "cart", "checkout"]).optional(),
});

export const Route = createFileRoute("/market")({
  validateSearch: marketSearchSchema,
  component: Market,
});

function Market() {
  const { nftId, view = "market" } = Route.useSearch();

  const nft = nfts.find((item) => item.id === nftId) ?? nfts[0];

  if (!nft && view === "market") {
    return (
      <>
        <main className="mx-auto min-h-[60vh] max-w-7xl px-5 py-16">
          <p className="text-muted">Nenhum NFT disponível.</p>
        </main>

        <div className="hidden sm:block">
          <AppFooter />
        </div>
      </>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        <MarketPage nft={nft} view={view} />
      </main>

      <div className="hidden sm:block">
        <AppFooter />
      </div>
    </>
  );
}
