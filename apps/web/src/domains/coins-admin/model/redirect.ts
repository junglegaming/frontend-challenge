const COINS_ADMIN_HOME = '/admin/coins'

/**
 * Where to go after signing in. Only paths inside the coins area are accepted, so a crafted `?redirect=` can never
 * send the administrator to another origin or to an unrelated page (open-redirect guard). `//host` and absolute
 * URLs never match because the value must start with `/admin/coins` followed by the end, `/`, `?` or `#`.
 */
export function safeCoinsAdminRedirect(redirect: string | undefined): string {
  return redirect !== undefined && /^\/admin\/coins(?:[/?#]|$)/.test(redirect) ? redirect : COINS_ADMIN_HOME
}
