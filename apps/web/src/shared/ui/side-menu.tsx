import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentType, MouseEvent, ReactNode, SVGProps } from 'react'
import { cn } from '@/shared/lib/cn'

interface SideMenuProps {
  title: string
  'aria-label': string
  children: ReactNode
  className?: string
}

/**
 * Account side panel. From `lg` up it is a column beside the content; below that it becomes a
 * horizontally scrollable strip above it, so the page itself never scrolls sideways.
 */
export function SideMenu({ title, children, className, ...props }: SideMenuProps) {
  return (
    <nav className={cn('min-w-0 bg-card', className)} {...props}>
      <h2 className="px-[10px] pb-2 pt-4 text-title font-bold">{title}</h2>
      <ul className="relative flex overflow-x-auto lg:block lg:overflow-visible">{children}</ul>
    </nav>
  )
}

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>

interface ItemCommon {
  icon: Icon
  /** Current page: amber vertical bar (column) / amber underline (strip) and aria-current="page". */
  active?: boolean
  /** Separator above the item (used before "Sair"). */
  separated?: boolean
  children: ReactNode
}

type SideMenuItemProps =
  | (ItemCommon & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'>)
  | (ItemCommon & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>)

const itemClass =
  'flex min-h-touch w-full shrink-0 items-center gap-3 whitespace-nowrap border-b-4 border-transparent px-[10px] text-left text-body text-primary hover:bg-background/40 focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring lg:h-[45px] lg:border-b-0 lg:border-l-[6px] disabled:cursor-not-allowed disabled:opacity-60'
const activeClass = 'border-primary bg-background/40'

/** A plain left click: not a modified one (new tab/window, download) and not aimed at another browsing context. */
const isPlainClick = (event: MouseEvent<HTMLAnchorElement>) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey &&
  (event.currentTarget.target === '' || event.currentTarget.target === '_self')

export function SideMenuItem({ icon: Icon, active, separated, children, ...rest }: SideMenuItemProps) {
  const router = useRouter()
  const itemRef = useRef<HTMLLIElement>(null)

  // In the strip (below `lg`) the current item can sit off screen: bring it into view, scrolling only the strip
  // itself and only when needed (never the page, and never an item that is already visible). The web font changes the
  // item widths when it arrives, so it is checked again then.
  useEffect(() => {
    const item = itemRef.current
    const strip = item?.parentElement
    if (!active || !item || !strip) return
    const reveal = () => {
      if (strip.scrollWidth <= strip.clientWidth) return
      if (item.offsetLeft < strip.scrollLeft) strip.scrollLeft = item.offsetLeft
      else if (item.offsetLeft + item.offsetWidth > strip.scrollLeft + strip.clientWidth) {
        strip.scrollLeft = item.offsetLeft + item.offsetWidth - strip.clientWidth
      }
    }
    reveal()
    void document.fonts?.ready.then(reveal)
  }, [active])

  const className = cn(itemClass, active && activeClass, rest.className)
  const content = (
    <>
      <Icon aria-hidden="true" size={16} strokeWidth={1.5} />
      {children}
    </>
  )
  return (
    <li ref={itemRef} className={cn('relative shrink-0 lg:shrink', separated && 'lg:border-t lg:border-border')}>
      {rest.href !== undefined ? (
        <a
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
          href={rest.href}
          aria-current={active ? 'page' : undefined}
          className={className}
          onClick={(event) => {
            ;(rest as AnchorHTMLAttributes<HTMLAnchorElement>).onClick?.(event)
            // Real link (new tab, copy address, no-JS) that moves through the router on a plain click: a full page
            // load would drop what lives only in memory, e.g. the coins administrator's session.
            if (isPlainClick(event) && rest.href !== undefined) {
              event.preventDefault()
              router.history.push(rest.href)
            }
          }}
        >
          {content}
        </a>
      ) : (
        <button type="button" {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} className={className}>
          {content}
        </button>
      )}
    </li>
  )
}
