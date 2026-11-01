import { Shimmer } from '@/shared/components/skeletons/Shimmer'

/** Props de {@link FacetListPlaceholder}. */
interface FacetListPlaceholderProps {
  /** Quantidade de linhas reservadas (mantém a altura final da lista). */
  rows: number
}

/**
 * Linhas com shimmer enquanto as facetas (coleções/redes) carregam, com a
 * mesma altura das linhas reais para não deslocar o layout.
 *
 * @param props - {@link FacetListPlaceholderProps}
 * @returns Lista decorativa de linhas de carregamento.
 */
export function FacetListPlaceholder({ rows }: FacetListPlaceholderProps) {
  return (
    <div aria-hidden="true" className="flex flex-col">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex h-[40px] items-center justify-between">
          <Shimmer className="h-3.5 w-28 rounded-[4px]" />
          <Shimmer className="h-3.5 w-8 rounded-[4px]" />
        </div>
      ))}
    </div>
  )
}
