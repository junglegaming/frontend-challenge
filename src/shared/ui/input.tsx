import * as React from 'react'

import { cn } from '@/shared/lib/cn'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-[40px] w-full min-w-0 rounded-[3px] border border-field bg-transparent px-3 font-mono text-[14px] text-foreground transition-colors outline-none placeholder:text-sand',
        'focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-coral',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
