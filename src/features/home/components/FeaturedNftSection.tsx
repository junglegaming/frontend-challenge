export function FeaturedNftSection() {
  return (
    <section aria-labelledby="featured-nft-title" className="bg-[#241612] pt-4">
      <h2 id="featured-nft-title" className="px-5 text-sm font-bold text-[#d4893f]">
        NFT EM DESTAQUE
      </h2>
      <p className="mt-2 text-center text-sm font-bold tracking-wide text-zinc-100">
        OFERTA LIMITADA
      </p>
      <img
        src="/assets/nfts/ape-gray.png"
        alt="Macaco com chapéu bucket verde e moletom roxo"
        className="mt-3 aspect-square w-full rounded-2xl object-cover"
      />
    </section>
  );
}
