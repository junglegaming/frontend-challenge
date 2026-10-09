import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type IconBadgeProps = ComponentProps<'span'> & {
  count: number;
};

export function IconBadge({
  count,
  children,
  className,
  ...props
}: IconBadgeProps) {
  const visible = Number.isSafeInteger(count) && count > 0;
  return (
    <span
      data-slot="icon-badge"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center align-middle leading-none',
        className
      )}
      {...props}
    >
      {children}
      {visible && (
        <span
          data-slot="icon-badge-count"
          aria-hidden="true"
          className="bg-primary text-ink pointer-events-none absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-medium"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {visible ? `Quantidade: ${count}` : ''}
      </span>
    </span>
  );
}
