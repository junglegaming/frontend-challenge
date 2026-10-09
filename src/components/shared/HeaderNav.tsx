import { cn } from 'cn';
import type { ComponentProps } from 'react';

export function HeaderNav({ className, ...props }: ComponentProps<'nav'>) {
  return (
    <nav className={cn('text-body-lg-bold flex gap-8', className)} {...props} />
  );
}
