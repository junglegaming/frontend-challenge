import { cn } from '@/shared/lib/cn'

interface CountBadgeProps {
  count: number
  className?: string
}

/**
 * Round amber counter (cart). Decorative: the parent control must expose the quantity in its
 * accessible name (e.g. "Carrinho, 6 item(ns)"). Renders nothing for 0.
 */
export function CountBadge({ count, className }: CountBadgeProps) {
  if (count <= 0) return null
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
