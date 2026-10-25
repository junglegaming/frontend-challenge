import { Skeleton } from '@/components/ui/skeleton'

export function NftDetailSkeleton() {
  return (
    <div role="status" aria-label="Carregando NFT" className="flex flex-col gap-8">
      <span className="sr-only">Carregando NFT…</span>
      <Skeleton className="hidden h-4 w-36 md:block" aria-hidden="true" />

      <div className="-mx-6 h-[506px] bg-card px-7 pt-[23px] md:hidden" aria-hidden="true">
        <div className="flex items-start justify-between">
          <Skeleton className="size-[35px] rounded-full" />
          <Skeleton className="size-[35px] rounded-full" />
        </div>
        <Skeleton className="mt-2 h-[356px] w-full rounded-3xl" />
      </div>

      <div className="hidden items-start gap-8 md:grid md:grid-cols-[573fr_595fr]">
        <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-7" aria-hidden="true">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full rounded-2xl" />
        </div>

        <div className="flex flex-col gap-3" aria-hidden="true">
          <div className="border-b border-border pb-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="mt-3 h-5 w-40" />
          </div>
          <div>
            <Skeleton className="h-4 w-28" />
            <div className="mt-3 flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <Skeleton className="mt-1 h-4 w-16" />
          <div className="flex gap-1.5">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-7 w-12 rounded-full" />
            ))}
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-7 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-[130px]" />
              <Skeleton className="h-10 w-[130px]" />
            </div>
          </div>
          <div className="mt-1 flex flex-col gap-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="mt-1 h-5 w-64" />
        </div>
      </div>

      <div className="-mx-6 -mt-[114px] rounded-t-[32px] bg-card px-6 pt-8 pb-8 md:hidden" aria-hidden="true">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-[27px] w-20 rounded-full" />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="mt-4 h-4 w-16" />
        <div className="mt-3 flex gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-7 w-12 rounded-full" />
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>
    </div>
  )
}
