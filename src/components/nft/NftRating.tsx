import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NftRatingProps {
  rating: number
  reviewsCount: number
  className?: string
}

export function NftRating({ rating, reviewsCount, className }: NftRatingProps) {
  const filled = Math.round(rating)
  const reviewsLabel =
    reviewsCount === 1 ? '1 avaliação de colecionador' : `${reviewsCount} avaliações de colecionadores`

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5 text-base leading-5 text-muted-foreground', className)}>
      <span className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn('size-[15px]', index < filled ? 'fill-primary text-primary' : 'text-border-soft')}
          />
        ))}
      </span>
      <span className="sr-only">Nota {rating.toFixed(1)} de 5.</span>
      <span>{reviewsLabel}</span>
    </div>
  )
}
