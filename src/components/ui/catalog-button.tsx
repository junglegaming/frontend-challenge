import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export type CatalogButtonProps = ComponentProps<'button'> & {
  active?: boolean;
};

export function CatalogButton({
  active = false,
  type = 'button',
  children,
  className,
  ...props
}: CatalogButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-pressed={active}
      className={cn(
        'cursor-pointer border-b-2 border-transparent pb-1.5 disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'border-primary text-primary text-body-bold'
          : 'text-foreground text-body-sm',
        'md:text-body-combo',
        className
      )}
    >
      {children}
    </button>
  );
}
