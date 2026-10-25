import { Skeleton } from '@/components/ui/skeleton'

export function CheckoutSkeleton() {
  return (
    <div aria-hidden="true">
      <p role="status" className="sr-only">
        Carregando pagamento…
      </p>
      <div className="grid gap-8 md:mt-6 xl:grid-cols-[minmax(0,1fr)_332px] xl:gap-x-[86px]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-5 w-52" />
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-11 w-full md:h-10" />
              </div>
            ))}
            <div className="flex flex-col gap-2 md:col-span-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-1">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-[150px] w-full" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 rounded-2xl bg-card p-4 md:rounded-none md:bg-transparent md:p-0">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-14 shrink-0 rounded-sm" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <Skeleton className="h-12 w-full rounded-full md:h-10 md:rounded-sm" />
        </div>
      </div>
    </div>
  )
}
