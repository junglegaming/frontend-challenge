import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export type AuthMode = 'login' | 'signup'

interface AuthTabsProps {
  mode: AuthMode
}

const tab = 'text-xl leading-5 transition-colors hover:text-accent-text'
const activeTab = 'text-primary'

export function AuthTabs({ mode }: AuthTabsProps) {
  return (
    <nav aria-label="Acesso à conta" className="flex items-center justify-center gap-2">
      <AuthModeLink mode="login" current={mode === 'login'} className={cn(tab, mode === 'login' ? activeTab : 'text-foreground')}>
        Entrar
      </AuthModeLink>
      <span className="h-5 w-px bg-primary" aria-hidden="true" />
      <AuthModeLink mode="signup" current={mode === 'signup'} className={cn(tab, mode === 'signup' ? activeTab : 'text-foreground')}>
        Criar conta
      </AuthModeLink>
    </nav>
  )
}

interface AuthModeLinkProps {
  mode: AuthMode
  current?: boolean
  className?: string
  children: React.ReactNode
}

/** Troca o modo na mesma rota (`?auth=`), preservando o redirect. */
export function AuthModeLink({ mode, current = false, className, children }: AuthModeLinkProps) {
  return (
    <Link to="." search={(prev) => ({ ...prev, auth: mode })} aria-current={current ? 'page' : undefined} className={className}>
      {children}
    </Link>
  )
}
