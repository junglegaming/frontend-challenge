import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'
import { coinsAdminLogout } from '../api/queries'
import { useCoinsAdminSession } from '../api/session'

/** Who is connected and the sign-out, shared by every page of the area (it lives here: pages cannot import pages). */
export function SessionBar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = useCoinsAdminSession()

  function onSignOut() {
    coinsAdminLogout(queryClient)
    // A deliberate sign-out goes back to the sign-in page without the "session expired" notice.
    void navigate({ to: '/admin/coins/login' })
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      {session && <p>Conectado como {session.email}</p>}
      <Button type="button" variant="outline" size="sm" onClick={onSignOut}>
        Sair
      </Button>
    </div>
  )
}
