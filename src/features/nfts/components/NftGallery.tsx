import { Search } from "lucide-react";
import type { Nft } from "@/contracts/nft";

interface NftGalleryProps {
  nft: Nft;
}

const thumbnails = [0, 1, 2, 3];

export function NftGallery({ nft }: NftGalleryProps) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3 sm:grid-cols-[100px_1fr] sm:gap-4">
      <ul className="flex flex-col gap-3 sm:gap-4" aria-label="Miniaturas do NFT">
        {thumbnails.map((index) => (
          <li key={index}>
            <button
              type="button"
              aria-label={`Ver imagem ${index + 1} de ${nft.name}`}
              aria-pressed={index === 0}
              className="block w-full bg-[#241612] p-1"
            >
              <img
                src={nft.imageUrl}
                alt=""
                className="aspect-square w-full rounded-md object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative self-start bg-[#241612] p-2">
        <img
          src={nft.imageUrl}
          alt={nft.name}
          className="aspect-[445/450] w-full rounded-2xl object-cover"
        />
        <button
          type="button"
          aria-label="Ampliar imagem"
          className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full bg-[#1a110d]/80 text-zinc-100 hover:text-[#d4893f]"
        >
          <Search className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
