import type { NftImage } from '@/schemas/nft'

export function nftImageProps(image: NftImage, sizes = '(min-width: 1024px) 280px, 50vw') {
  return {
    src: `/nfts/${image}-640.webp`,
    srcSet: `/nfts/${image}-640.webp 640w, /nfts/${image}-1080.webp 1080w`,
    sizes,
    width: 640,
    height: 640,
  }
}
