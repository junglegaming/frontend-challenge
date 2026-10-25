import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/hooks/useSession'

/** Layout sem caminho que protege as rotas privadas (checkout, pedidos, perfil, carteiras). */
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (!user) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { user }
  },
  component: Outlet,
})
