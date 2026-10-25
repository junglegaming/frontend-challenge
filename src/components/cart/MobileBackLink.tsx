import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBackLinkProps {
  to: '/' | '/cart'
  label: string
  className?: string
}

export function MobileBackLink({ to, label, className }: MobileBackLinkProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        'grid size-[34px] shrink-0 place-items-center rounded-full border border-border bg-card text-accent-text transition-colors hover:text-primary',
        className,
      )}
    >
      <ChevronLeft className="size-5" aria-hidden="true" />
    </Link>
  )
}
