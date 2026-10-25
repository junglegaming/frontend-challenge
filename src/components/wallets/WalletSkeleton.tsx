import { Skeleton } from '@/components/ui/skeleton'

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3.5 w-full max-w-[520px]" />
      </div>
      <div className="grid gap-7 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-10 w-full rounded-sm" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-[131px] rounded-sm" />
    </div>
  )
}

export function WalletSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <CardSkeleton />
      <Skeleton className="h-4 w-48" />
    </div>
  )
}
