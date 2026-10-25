import { createFileRoute, redirect } from '@tanstack/react-router'
import { authHref } from '@/components/auth/safe-redirect'
import { redirectSearchSchema } from '@/lib/redirect'

/** Guards, sessão expirada e links diretos chegam aqui; o diálogo abre sobre uma página real via `?auth=`. */
export const Route = createFileRoute('/signup')({
  validateSearch: redirectSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({ href: authHref('signup', search.redirect), replace: true })
  },
})
