import { useState } from 'react'
import type { NftImage } from '@/domains/catalog'
import { cn } from '@/shared/lib/cn'

export function Gallery({ images }: { images: NftImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex] ?? images[0]

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {images.length > 1 && (
        <fieldset
          aria-label="Miniaturas da galeria"
          className="m-0 flex gap-3 overflow-x-auto border-0 p-0 sm:flex-col sm:overflow-visible"
        >
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-pressed={index === activeIndex}
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              className={cn(
                'size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:size-20',
                index === activeIndex ? 'border-primary' : 'border-transparent hover:border-border',
              )}
            >
              <img src={image.src} alt="" className="size-full object-cover" width={80} height={80} />
            </button>
          ))}
        </fieldset>
      )}

      <div className="aspect-square w-full flex-1 overflow-hidden rounded-2xl bg-card">
        {active && (
          <img
            src={active.src}
            alt={active.alt}
            width={active.width}
            height={active.height}
            className="size-full object-cover"
          />
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        Imagem {activeIndex + 1} de {images.length}: {active?.alt}
      </p>
    </div>
  )
}
