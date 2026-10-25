import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { Activity, AlertTriangle, Download, Heart, LogOut, ShoppingBag, User, Wallet } from 'lucide-react'
import { ComingSoon } from '@/components/common/ComingSoon'
import { useLogout } from '@/hooks/useSession'
import { cn } from '@/lib/utils'

const itemClass =
  'flex h-10 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-sm whitespace-nowrap text-accent-text transition-colors md:h-[45px] md:gap-3 md:border-b-0 md:border-l-4 md:px-4 md:text-[15px]'
const activeClass = 'border-primary'
const inactiveClass = 'hover:text-foreground'
const iconClass = 'size-4.5 text-primary'

const OUT_OF_SCOPE = [
  { label: 'Atividade', icon: ShoppingBag },
  { label: 'Lista de interesse', icon: Heart },
  { label: 'Ofertas', icon: Activity },
  { label: 'Arquivos baixados', icon: Download },
  { label: 'Suporte', icon: AlertTriangle },
] as const

export function AccountSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const logout = useLogout()

  const onLogout = () =>
    logout.mutate(undefined, {
      onSettled: () => void navigate({ href: '/', replace: true }),
    })

  return (
    <aside className="min-w-0 md:w-[310px] md:shrink-0">
      <div className="border border-border bg-card md:border-0">
        <h2 className="hidden px-2.5 py-2 text-lg font-bold md:block">Meu perfil</h2>
        <nav aria-label="Conta" className="flex gap-1 overflow-x-auto px-2 md:flex-col md:gap-0 md:px-0">
          <Link
            to="/profile"
            aria-current={pathname === '/profile' ? 'page' : undefined}
            className={cn(itemClass, pathname === '/profile' ? activeClass : inactiveClass)}
          >
            <User className={iconClass} aria-hidden="true" />
            Dados do perfil
          </Link>
          <Link
            to="/wallets"
            aria-current={pathname === '/wallets' ? 'page' : undefined}
            className={cn(itemClass, pathname === '/wallets' ? activeClass : inactiveClass)}
          >
            <Wallet className={iconClass} aria-hidden="true" />
            Carteiras
          </Link>
          {OUT_OF_SCOPE.map(({ label, icon: Icon }) => (
            <ComingSoon key={label} className={cn(itemClass, inactiveClass)}>
              <span className="flex items-center gap-2 md:gap-4">
                <Icon className={iconClass} aria-hidden="true" />
                {label}
              </span>
            </ComingSoon>
          ))}
          <button
            type="button"
            onClick={onLogout}
            disabled={logout.isPending}
            className={cn(itemClass, inactiveClass, 'mt-0 border-t border-border font-bold md:mt-2 md:w-full md:text-left')}
          >
            <LogOut className={iconClass} aria-hidden="true" />
            {logout.isPending ? 'Saindo…' : 'Sair'}
          </button>
        </nav>
      </div>
    </aside>
  )
}
