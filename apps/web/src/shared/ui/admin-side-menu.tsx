import { ActivityIcon, HomeIcon, LogoutIcon, MarketIcon, ProfileIcon, WalletIcon } from '@/shared/icons'
import { SideMenu, SideMenuItem } from './side-menu'

type AdminArea = 'overview' | 'products' | 'users' | 'orders' | 'coins'

/**
 * Admin navigation shared by every `/admin/*` page (Visão geral, Produtos, Usuários, Pedidos, Moedas). Purely
 * presentational, same pattern as `AccountSideMenu`: the active item and the sign-out action are injected by the
 * caller. "Moedas" belongs to another context (the real coins administrator, its own sign-in): the menu only links,
 * each route guards itself. The sign-out ends the SITE session, so it reads "Sair do site": inside the coins area
 * a plain "Sair" already ends only the access to the coins service.
 */
export function AdminSideMenu({ active, onLogout }: { active: AdminArea; onLogout: () => void }) {
  return (
    <SideMenu title="Administração" aria-label="Administração">
      <SideMenuItem icon={HomeIcon} href="/admin" active={active === 'overview'}>
        Visão geral
      </SideMenuItem>
      <SideMenuItem icon={MarketIcon} href="/admin/products" active={active === 'products'}>
        Produtos
      </SideMenuItem>
      <SideMenuItem icon={ProfileIcon} href="/admin/users" active={active === 'users'}>
        Usuários
      </SideMenuItem>
      <SideMenuItem icon={ActivityIcon} href="/admin/orders" active={active === 'orders'}>
        Pedidos
      </SideMenuItem>
      <SideMenuItem icon={WalletIcon} href="/admin/coins" active={active === 'coins'}>
        Moedas
      </SideMenuItem>
      <SideMenuItem icon={LogoutIcon} separated onClick={onLogout} className="font-bold">
        Sair do site
      </SideMenuItem>
    </SideMenu>
  )
}
