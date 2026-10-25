import { Skeleton } from '@/components/ui/skeleton'

/** Mesmas proporções do NftCard para não deslocar o layout quando os dados chegam. */
export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 md:gap-3" aria-hidden="true">
      <div className="flex aspect-[7/8] items-center bg-card p-1 md:aspect-[43/50]">
        <Skeleton className="aspect-square w-full rounded-2xl" />
      </div>
      <div className="flex flex-col gap-0 md:gap-3">
        <Skeleton className="h-4 w-3/4 md:h-4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}
