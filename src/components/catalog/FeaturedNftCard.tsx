import { Link } from '@tanstack/react-router'
import { nftImageProps } from '@/lib/images'
import type { NftSummary } from '@/schemas/nft'

interface FeaturedNftCardProps {
  nft: NftSummary
}

export function FeaturedNftCard({ nft }: FeaturedNftCardProps) {
  return (
    <aside aria-labelledby="featured-title" className="pt-6">
      <p id="featured-title" className="px-5 text-lg leading-8 font-bold tracking-wide text-accent-text">
        NFT EM DESTAQUE
      </p>
      <p className="mt-4 px-5 text-center text-sm leading-4 font-bold tracking-wide">OFERTA LIMITADA</p>
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        aria-label={`Ver ${nft.name} em destaque`}
        className="mt-4 block overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-ring"
      >
        <img
          {...nftImageProps(nft.image, '(min-width: 1024px) 310px, 60vw')}
          alt={`Arte do NFT ${nft.name}`}
          loading="lazy"
          decoding="async"
          className="aspect-[310/368] w-full rounded-2xl object-cover transition-transform duration-300 motion-safe:hover:scale-[1.02]"
        />
      </Link>
    </aside>
  )
}
