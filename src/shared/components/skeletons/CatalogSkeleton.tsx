import { cn } from '@/shared/lib/cn'

import { NftCardSkeleton } from './NftCardSkeleton'

/** Props de {@link CatalogSkeleton}. */
interface CatalogSkeletonProps {
  /** Quantidade de cards. Use o tamanho da página para não "pular" ao carregar. Padrão: 6. */
  itemCount?: number
  /** Classes extras para a grade. */
  className?: string
}

/**
 * Grade de {@link NftCardSkeleton} para o catálogo da tela Início. Segue as
 * mesmas colunas da grade real (1 → 2 → 3) e anuncia o carregamento uma única
 * vez via `role="status"`.
 *
 * @param props - {@link CatalogSkeletonProps}
 * @returns Região de status com a grade de placeholders.
 * @example
 * if (catalogQuery.isPending) return <CatalogSkeleton itemCount={PAGE_SIZE} />
 */
export function CatalogSkeleton({ itemCount = 6, className }: CatalogSkeletonProps) {
  return (
    <div role="status" aria-label="Carregando catálogo">
      <span className="sr-only">Carregando catálogo…</span>
      <ul
        aria-hidden="true"
        className={cn(
          'grid w-full grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-6 lg:gap-x-[34px] lg:gap-y-[72px] xl:w-[842px] xl:grid-cols-3',
          className,
        )}
      >
        {Array.from({ length: itemCount }, (_, index) => (
          <li key={index}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  )
}
