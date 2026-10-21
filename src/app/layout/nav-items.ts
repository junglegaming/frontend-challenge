import { CartIcon, HeartIcon, HomeIcon, MarketIcon, ProfileIcon, type IconComponent } from '@/shared/icons'

export interface NavItem {
  id: 'home' | 'market' | 'creators' | 'learn' | 'cart' | 'favorites' | 'account'
  label: string
  icon: IconComponent
  /** Existing route, or null while the destination is out of scope / not built. */
  to: '/' | '/account/profile' | '/cart' | null
  /** False when `to` is null: rendered disabled, never as a working link. */
  enabled: boolean
  placement: ReadonlyArray<'navbar' | 'dock'>
}

/** Single source for Navbar and Dock so both always agree (specs/001-design-system-standards/data-model.md). */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', label: 'Início', icon: HomeIcon, to: '/', enabled: true, placement: ['navbar', 'dock'] },
  { id: 'market', label: 'Mercado', icon: MarketIcon, to: null, enabled: false, placement: ['navbar', 'dock'] },
  { id: 'creators', label: 'Criadores', icon: ProfileIcon, to: null, enabled: false, placement: ['navbar'] },
  { id: 'learn', label: 'Aprenda', icon: HomeIcon, to: null, enabled: false, placement: ['navbar'] },
  { id: 'cart', label: 'Carrinho', icon: CartIcon, to: '/cart', enabled: true, placement: ['dock'] },
  { id: 'favorites', label: 'Favoritos', icon: HeartIcon, to: null, enabled: false, placement: ['dock'] },
  { id: 'account', label: 'Conta', icon: ProfileIcon, to: '/account/profile', enabled: true, placement: ['dock'] },
]

export const navbarItems = NAV_ITEMS.filter((item) => item.placement.includes('navbar'))
export const dockItems = NAV_ITEMS.filter((item) => item.placement.includes('dock'))
