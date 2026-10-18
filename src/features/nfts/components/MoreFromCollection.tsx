import { Link } from "@tanstack/react-router";
import type { Nft } from "@/contracts/nft";
import { useNfts } from "@/features/nfts/queries";

interface MoreFromCollectionProps {
  currentNftId: string;
}

function CollectionNftCard({ nft }: { nft: Nft }) {
  return (
    <article>
      <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="group block">
        <div className="bg-[#241612] p-2">
          <img
            src={nft.imageUrl}
            alt={nft.name}
            className="aspect-square w-full rounded-xl object-cover"
          />
        </div>
        <h3 className="mt-2 text-[11px] text-zinc-100 group-hover:text-[#d4893f]">{nft.name}</h3>
        <p className="mt-0.5 text-[11px] font-bold text-[#d4893f]">{nft.price} ETH</p>
      </Link>
    </article>
  );
}

export function MoreFromCollection({ currentNftId }: MoreFromCollectionProps) {
  const { data, isLoading, isError } = useNfts();

  const related = (data ?? []).filter((nft) => nft.id !== currentNftId).slice(0, 5);

  return (
    <section aria-labelledby="more-from-collection-title">
      <h2
        id="more-from-collection-title"
        className="border-b border-[#3a2416] pb-2 text-xs font-bold text-[#d4893f]"
      >
        Mais desta coleção
      </h2>

      {isLoading && (
        <p role="status" className="mt-6 text-[11px] text-zinc-400">
          Carregando...
        </p>
      )}

      {isError && (
        <p role="alert" className="mt-6 text-[11px] text-red-400">
          Não foi possível carregar a coleção.
        </p>
      )}

      {!isLoading && !isError && related.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((nft) => (
              <CollectionNftCard key={nft.id} nft={nft} />
            ))}
          </div>

          <div className="mt-6 flex justify-center gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full border border-[#d4893f]" />
            <span className="size-2 rounded-full bg-[#d4893f]" />
            <span className="size-2 rounded-full border border-[#d4893f]" />
          </div>
        </>
      )}
    </section>
  );
}
