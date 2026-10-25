import { isInternalPath } from '@/lib/redirect'

/** Só caminhos internos podem virar destino pós-login (evita open redirect). */
export function safeRedirect(redirect: string | undefined): string {
  return redirect && isInternalPath(redirect) ? redirect : '/'
}

/** Rotas que exigem sessão: nunca são destino ao sair de /login (o guard devolveria ao login). */
const PRIVATE_PATHS = ['/checkout', '/profile', '/wallets', '/orders']

/** Destino ao fechar /login: o redirect só vale se for uma rota pública; senão a home. */
function publicRedirect(redirect: string | undefined): string {
  const target = safeRedirect(redirect)
  return PRIVATE_PATHS.some((path) => target.startsWith(path)) ? '/' : target
}

/**
 * /login e /signup não têm tela própria: viram o diálogo sobre uma página real (a de destino, se pública, ou a home),
 * mantendo o `redirect` para depois do login.
 */
export function authHref(mode: 'login' | 'signup', redirect: string | undefined): string {
  const url = new URL(publicRedirect(redirect), 'http://localhost')
  url.searchParams.set('auth', mode)
  if (redirect) url.searchParams.set('redirect', safeRedirect(redirect))
  return url.pathname + url.search
}
