import { Skeleton } from '@/shared/ui/skeleton'

export function NftDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Carregando NFT">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex gap-3 sm:flex-col">
            {['a', 'b', 'c'].map((key) => (
              <Skeleton key={key} className="size-16 shrink-0 rounded-lg sm:size-20" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full flex-1 rounded-2xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-48" />
        </div>
      </div>
    </div>
  )
}
