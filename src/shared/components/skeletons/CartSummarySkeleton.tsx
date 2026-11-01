import { cn } from '@/shared/lib/cn'

import { Shimmer } from './Shimmer'

/** Props de {@link CartSummarySkeleton}. */
interface CartSummarySkeletonProps {
  /** Quantidade de linhas de item. Padrão: 3. */
  lineCount?: number
  /** Classes extras para o container. */
  className?: string
}

/**
 * Placeholder do resumo do carrinho: linhas de item (miniatura, nome e preço),
 * total e botão de finalizar.
 *
 * @param props - {@link CartSummarySkeletonProps}
 * @returns Região de status com os placeholders do resumo.
 * @example
 * if (cartQuery.isPending) return <CartSummarySkeleton lineCount={2} />
 */
export function CartSummarySkeleton({ lineCount = 3, className }: CartSummarySkeletonProps) {
  return (
    <div role="status" aria-label="Carregando resumo do carrinho">
      <span className="sr-only">Carregando resumo do carrinho…</span>
      <div
        aria-hidden="true"
        className={cn(
          'flex flex-col gap-4 rounded-2xl bg-surface-card p-4 shadow-card sm:p-6',
          className,
        )}
      >
        <Shimmer className="h-6 w-32 rounded-[5px]" />

        <ul className="flex flex-col gap-3">
          {Array.from({ length: lineCount }, (_, index) => (
            <li key={index} className="flex items-center gap-3">
              <Shimmer className="size-12 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Shimmer className="h-4 w-3/4 rounded-[4px]" />
                <Shimmer className="h-3 w-1/2 rounded-[4px]" />
              </div>
              <Shimmer className="h-4 w-16 shrink-0 rounded-[4px]" />
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-surface-dark pt-4">
          <Shimmer className="h-5 w-16 rounded-[4px]" />
          <Shimmer className="h-6 w-28 rounded-[5px]" />
        </div>

        <Shimmer className="h-12 w-full rounded-[5px]" />
      </div>
    </div>
  )
}
