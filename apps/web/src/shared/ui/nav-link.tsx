import { Link, type LinkProps } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

const base =
  'relative inline-flex h-16 items-center px-1 text-action text-foreground transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring'
const active = 'font-bold text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'

interface NavLinkProps {
  to: LinkProps['to'] | null
  children: ReactNode
  className?: string
}

/**
 * Main-navigation item: default, active (amber underline + aria-current="page") and disabled.
 * A null `to` renders an inert, announced-as-disabled item so out-of-scope destinations never look functional.
 */
export function NavLink({ to, children, className }: NavLinkProps) {
  if (!to) {
    return (
      <span aria-disabled="true" title="Em breve" className={cn(base, 'cursor-not-allowed opacity-60 hover:text-foreground', className)}>
        {children}
      </span>
    )
  }
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      activeProps={{ 'aria-current': 'page', className: active }}
      className={cn(base, className)}
    >
      {children}
    </Link>
  )
}
