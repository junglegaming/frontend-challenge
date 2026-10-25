import { Skeleton } from '@/components/ui/skeleton'

export function CartSkeleton() {
  return (
    <div>
      <p role="status" className="sr-only">
        Carregando carrinho…
      </p>
      <div className="grid gap-8 pb-[370px] md:pb-0 xl:grid-cols-[minmax(0,1fr)_332px] xl:gap-x-[86px]" aria-hidden="true">
        <div>
          <div className="hidden grid-cols-[minmax(0,1fr)_138px_136px_148px_48px] border-b border-border pb-3 text-sm leading-4 font-bold md:grid">
            {['NFTs', 'Preço', 'Edições', 'Total'].map((label) => (
              <span key={label} className="text-sm font-bold">
                {label}
              </span>
            ))}
            <span />
          </div>
          <ul className="mt-0 flex flex-col gap-5 md:mt-3 md:gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index} className="h-[100px] overflow-hidden rounded-xl bg-card md:h-[70px] md:rounded-sm">
                <div className="flex h-full items-center gap-3 md:grid md:grid-cols-[minmax(0,1fr)_138px_136px_148px_48px] md:gap-0">
                  <div className="flex h-full min-w-0 flex-1 items-center gap-3 md:gap-4">
                    <Skeleton className="size-[100px] shrink-0 rounded-none md:size-[70px] md:rounded" />
                    <div className="flex w-full max-w-56 flex-col gap-2 pr-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="mt-3 h-4 w-1/3 md:hidden" />
                    </div>
                  </div>
                  <Skeleton className="hidden h-4 w-20 md:block" />
                  <Skeleton className="hidden h-5 w-20 md:block" />
                  <Skeleton className="hidden h-4 w-24 md:block" />
                  <Skeleton className="hidden size-7 md:block" />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[480px] flex-col gap-6 rounded-t-[32px] bg-card px-6 pt-6 pb-9 md:static md:z-auto md:w-auto md:max-w-none md:rounded-none md:bg-transparent md:p-0">
          <Skeleton className="h-[50px] w-full rounded-full md:h-10 md:rounded-sm" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-5 w-1/2" />
          </div>
          <Skeleton className="h-[60px] w-full rounded-full md:h-10 md:rounded-sm" />
        </div>
      </div>
    </div>
  )
}
