import { cn } from '@/shared/lib/cn'

import { Shimmer } from './Shimmer'

const THUMBNAIL_COUNT = 4

/** Props de {@link NftDetailSkeleton}. */
interface NftDetailSkeletonProps {
  /** Classes extras para o container. */
  className?: string
}

/**
 * Placeholder da tela de detalhe do NFT: galeria (arte principal + miniaturas)
 * e bloco de informações (título, criador, descrição, preço e ação de compra).
 * Empilhado no mobile, lado a lado a partir de `lg`.
 *
 * @param props - {@link NftDetailSkeletonProps}
 * @returns Região de status com os placeholders da tela.
 * @example
 * if (nftQuery.isPending) return <NftDetailSkeleton />
 */
export function NftDetailSkeleton({ className }: NftDetailSkeletonProps) {
  return (
    <div role="status" aria-label="Carregando detalhes do NFT">
      <span className="sr-only">Carregando detalhes do NFT…</span>
      <div
        aria-hidden="true"
        className={cn('grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10', className)}
      >
        <div className="flex flex-col gap-3">
          <Shimmer className="aspect-square w-full rounded-2xl" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: THUMBNAIL_COUNT }, (_, index) => (
              <Shimmer key={index} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl bg-surface-card p-4 shadow-card sm:p-6">
          <div className="flex flex-col gap-3">
            <Shimmer className="h-4 w-28 rounded-[4px]" />
            <Shimmer className="h-8 w-4/5 rounded-[5px]" />
            <div className="flex items-center gap-3">
              <Shimmer className="size-10 rounded-full" />
              <Shimmer className="h-4 w-36 rounded-[4px]" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Shimmer className="h-4 w-full rounded-[4px]" />
            <Shimmer className="h-4 w-full rounded-[4px]" />
            <Shimmer className="h-4 w-2/3 rounded-[4px]" />
          </div>

          <div className="flex flex-col gap-2 border-t border-surface-dark pt-6">
            <Shimmer className="h-4 w-20 rounded-[4px]" />
            <Shimmer className="h-8 w-40 rounded-[5px]" />
          </div>

          <Shimmer className="h-12 w-full rounded-[5px]" />
        </div>
      </div>
    </div>
  )
}
