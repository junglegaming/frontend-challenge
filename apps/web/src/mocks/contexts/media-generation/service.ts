import type { GeneratedImage } from '@/domains/media-generation'
import { errors } from '../../http/errors'
import { fnv1a, tile } from '@/mocks/infra/placeholder-art.mjs'

/** Browser-safe UTF-8 → base64 (plain `btoa` rejects non-Latin1 chars, e.g. Portuguese accents in the prompt). */
function toDataUri(svg: string): string {
  const bytes = new TextEncoder().encode(svg)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return `data:image/svg+xml;base64,${btoa(binary)}`
}

export class MediaGenerationService {
  generateImage(prompt: string): GeneratedImage {
    const trimmed = prompt.trim()
    if (!trimmed) {
      const message = 'Informe uma descrição para gerar a imagem.'
      throw errors.validation({ prompt: message }, message)
    }

    const seed = fnv1a(trimmed)
    const label = trimmed.slice(0, 24).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    const svg = tile(seed, label)
    return {
      src: toDataUri(svg),
      alt: trimmed,
      width: 600,
      height: 600,
      prompt: trimmed,
      seed,
    }
  }
}
