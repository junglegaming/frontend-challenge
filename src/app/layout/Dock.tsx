import { Link } from '@tanstack/react-router'
import { iconProps } from '@/shared/icons'
import { cn } from '@/shared/lib/cn'
import { dockItems } from './nav-items'

/** Height reserved at the bottom of the page so the Dock never covers the last content. */
export const DOCK_HEIGHT_CLASS = 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0'

const itemBase =
  'relative flex min-h-touch min-w-touch flex-1 flex-col items-center justify-center gap-1 px-1 pt-2 text-caption focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring'

/**
 * Fixed bottom navigation for small screens (< md). Uses the same items as the Navbar.
 * Active item: primary color + a top bar (never color alone) and aria-current="page".
 * Destinations without a route are rendered disabled, not as links.
 */
export function Dock() {
  return (
    <nav
      aria-label="Navegação rápida"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {dockItems.map(({ id, label, icon: Icon, to, enabled }) =>
        enabled && to ? (
          <Link
            key={id}
            to={to}
            activeOptions={{ exact: true }}
            activeProps={{
              'aria-current': 'page',
              className: 'font-bold text-primary before:absolute before:inset-x-3 before:top-0 before:h-0.5 before:bg-primary',
            }}
            className={cn(itemBase, 'text-foreground')}
          >
            <Icon {...iconProps} size={24} />
            {label}
          </Link>
        ) : (
          <span key={id} aria-disabled="true" title="Em breve" className={cn(itemBase, 'cursor-not-allowed text-muted-foreground opacity-60')}>
            <Icon {...iconProps} size={24} />
            {label}
          </span>
        ),
      )}
    </nav>
  )
}
