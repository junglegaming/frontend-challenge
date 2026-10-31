import { NftList } from "@/components/ui/nft-list";
import type { NFT } from "@/data/nfts";
import { MarketCart } from "./cart";
import { MarketCheckout } from "./checkout";
import { MarketSection } from "./components";

interface MarketPageProps {
  nft: NFT;
  view?: "market" | "cart" | "checkout";
}

export function MarketPage({ nft, view = "market" }: MarketPageProps) {
  if (view === "checkout") {
    return <MarketCheckout />;
  }

  return (
    <div>
      {view === "cart" ? <MarketCart /> : <MarketSection nft={nft} />}

      <section className="mt-16 hidden sm:block">
        <h2 className="border-b border-border pb-3 text-lg font-bold text-primary">
          {view === "cart"
            ? "Colecionadores também viram"
            : "Mais desta coleção"}
        </h2>

        <div className="mt-5">
          <NftList />
        </div>
      </section>
    </div>
  );
}
