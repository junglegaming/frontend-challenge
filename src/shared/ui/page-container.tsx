import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

/** Standard page width and gutters: max 1200 px, 16 px gutter on mobile, 24 px from `md`. */
export function PageContainer({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-[1200px] px-4 md:px-6', className)} {...props} />
}
