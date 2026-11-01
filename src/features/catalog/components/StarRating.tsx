import { Star } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

/** Props de {@link StarRating}. */
interface StarRatingProps {
  /** Nota de 0 a 5 (pode ser decimal, ex.: 4.8). */
  rating: number
  /** Classe de tamanho das estrelas. */
  starClassName?: string
  className?: string
}

/**
 * Estrelas de avaliação: cheias até a nota arredondada. Anunciadas como uma
 * imagem com a nota por extenso, não como cinco ícones soltos.
 *
 * @param props - {@link StarRatingProps}
 * @returns Cinco estrelas com rótulo acessível.
 * @example
 * <StarRating rating={4.8} />
 */
export function StarRating({ rating, starClassName = 'size-[15px]', className }: StarRatingProps) {
  const filled = Math.round(rating)
  return (
    <span
      role="img"
      aria-label={`Avaliação ${rating.toLocaleString('pt-BR')} de 5 estrelas`}
      className={cn('flex items-center gap-1', className)}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            starClassName,
            index < filled
              ? 'fill-primary text-primary'
              : 'fill-text-secondary text-text-secondary',
          )}
        />
      ))}
    </span>
  )
}
