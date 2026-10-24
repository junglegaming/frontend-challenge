import type { NftImage } from '@/domains/catalog'

export interface GenerateImageRequest {
  prompt: string
}

export interface GeneratedImage extends NftImage {
  prompt: string
  seed: number
}
