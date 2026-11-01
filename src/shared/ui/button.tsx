import * as React from 'react'

import { type VariantProps, cva } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/shared/lib/cn'

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-mono font-bold whitespace-nowrap transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'rounded-[8px] bg-primary text-ink shadow-button hover:bg-highlight',
        destructive: 'rounded-[8px] bg-error text-white hover:bg-error/90',
        outline:
          'rounded-[6px] border border-primary bg-transparent text-highlight hover:bg-primary/10',
        secondary:
          'rounded-[6px] border border-field bg-surface-raised text-foreground hover:border-primary/60',
        ghost: 'rounded-[6px] text-foreground hover:text-highlight',
        link: 'font-medium text-highlight underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[45px] px-4 text-[15px] leading-4',
        sm: 'h-[36px] px-3 text-[14px]',
        lg: 'h-[60px] px-6 text-[15px]',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
