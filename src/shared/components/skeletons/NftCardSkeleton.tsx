import { cn } from '@/shared/lib/cn'

import { Shimmer } from './Shimmer'

/** Props de {@link NftCardSkeleton}. */
interface NftCardSkeletonProps {
  /** Classes extras para o container do card. */
  className?: string
}

/**
 * Placeholder de um card de NFT: arte quadrada, título, coleção e preço.
 *
 * Imagem em `aspect-square` e linhas com altura fixa igual à do texto real,
 * para que a troca pelo card carregado não cause layout shift.
 *
 * @param props - {@link NftCardSkeletonProps}
 * @returns Card decorativo (`aria-hidden`).
 * @example
 * <NftCardSkeleton />
 */
export function NftCardSkeleton({ className }: NftCardSkeletonProps) {
  return (
    <div aria-hidden="true" className={cn('flex w-full flex-col gap-3 xl:w-[258px]', className)}>
      <div className="flex h-[300px] w-full items-center justify-center bg-card xl:w-[258px]">
        <Shimmer className="size-[250px] rounded-[15px]" />
      </div>

      <div className="flex flex-col gap-1 w-full">
        <Shimmer className="h-4 w-3/4 rounded-[4px]" />
        <Shimmer className="h-4 w-1/3 rounded-[4px]" />
      </div>
    </div>
  )
}
