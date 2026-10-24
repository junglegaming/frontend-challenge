import { CartIcon, HeartIcon, HomeIcon, MarketIcon, ProfileIcon, type IconComponent } from '@/shared/icons'
import type { UserRole } from '@/domains/auth'

export interface NavItem {
  id: 'home' | 'market' | 'creators' | 'learn' | 'cart' | 'favorites' | 'account' | 'admin'
  label: string
  /** Shorter text for tight spots (the Dock); the full `label` stays the accessible name. */
  shortLabel?: string
  icon: IconComponent
  /** Existing route, or null while the destination is out of scope / not built. */
  to: '/' | '/account/profile' | '/admin' | '/cart' | '/market' | '/creators' | '/learn' | null
  /** False when `to` is null: rendered disabled, never as a working link. */
  enabled: boolean
  placement: ReadonlyArray<'navbar' | 'dock'>
  /** Shown only to a signed-in user with exactly this role; an unknown or missing role never sees it. */
  requiresRole?: UserRole
}

/** Single source for Navbar and Dock so both always agree (specs/001-design-system-standards/data-model.md). */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', label: 'Início', icon: HomeIcon, to: '/', enabled: true, placement: ['navbar', 'dock'] },
  { id: 'market', label: 'Mercado', icon: MarketIcon, to: '/market', enabled: true, placement: ['navbar', 'dock'] },
  { id: 'creators', label: 'Criadores', icon: ProfileIcon, to: '/creators', enabled: true, placement: ['navbar'] },
  { id: 'learn', label: 'Aprenda', icon: HomeIcon, to: '/learn', enabled: true, placement: ['navbar'] },
  { id: 'cart', label: 'Carrinho', icon: CartIcon, to: '/cart', enabled: true, placement: ['dock'] },
  { id: 'favorites', label: 'Favoritos', icon: HeartIcon, to: null, enabled: false, placement: ['dock'] },
  { id: 'account', label: 'Conta', icon: ProfileIcon, to: '/account/profile', enabled: true, placement: ['dock'] },
  { id: 'admin', label: 'Administração', shortLabel: 'Admin', icon: MarketIcon, to: '/admin', enabled: true, placement: ['navbar', 'dock'], requiresRole: 'admin' },
]

export const navbarItems = NAV_ITEMS.filter((item) => item.placement.includes('navbar'))
export const dockItems = NAV_ITEMS.filter((item) => item.placement.includes('dock'))

/** Items a user may see: those without a role requirement, plus those whose required role matches. */
export function visibleFor(items: readonly NavItem[], role: UserRole | undefined): readonly NavItem[] {
  return items.filter((item) => !item.requiresRole || item.requiresRole === role)
}
