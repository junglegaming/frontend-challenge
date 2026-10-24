import {
  ActivityIcon,
  DownloadIcon,
  HeartIcon,
  LogoutIcon,
  MarketIcon,
  OffersIcon,
  ProfileIcon,
  SupportIcon,
  WalletIcon,
  type IconComponent,
} from '@/shared/icons'
import { SideMenu, SideMenuItem } from './side-menu'

/** Sections outside the challenge scope are shown as in the layout, but are inert and announced as unavailable. */
const UNAVAILABLE: { label: string; icon: IconComponent }[] = [
  { label: 'Atividade', icon: ActivityIcon },
  { label: 'Lista de interesse', icon: HeartIcon },
  { label: 'Ofertas', icon: OffersIcon },
  { label: 'Arquivos baixados', icon: DownloadIcon },
  { label: 'Suporte', icon: SupportIcon },
]

/**
 * Account navigation shared by every `/account/*` page (Perfil, Carteiras). Purely presentational —
 * the active item, the logout action and whether to offer "Administração" (administrators only) are injected by
 * the caller, same pattern as `Navbar`.
 */
export function AccountSideMenu({
  active,
  onLogout,
  showAdmin = false,
}: {
  active: 'profile' | 'wallets'
  onLogout: () => void
  showAdmin?: boolean
}) {
  return (
    <SideMenu title="Meu perfil" aria-label="Minha conta">
      <SideMenuItem icon={ProfileIcon} href="/account/profile" active={active === 'profile'}>
        Dados do perfil
      </SideMenuItem>
      <SideMenuItem icon={WalletIcon} href="/account/wallets" active={active === 'wallets'}>
        Carteiras
      </SideMenuItem>
      {showAdmin && (
        <SideMenuItem icon={MarketIcon} href="/admin">
          Administração
        </SideMenuItem>
      )}
      {UNAVAILABLE.map(({ label, icon }) => (
        <SideMenuItem key={label} icon={icon} disabled title="Em breve">
          {label}
          <span className="sr-only"> (indisponível)</span>
        </SideMenuItem>
      ))}
      <SideMenuItem icon={LogoutIcon} separated onClick={onLogout} className="font-bold">
        Sair
      </SideMenuItem>
    </SideMenu>
  )
}
