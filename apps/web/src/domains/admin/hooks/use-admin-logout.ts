import { useNavigate } from '@tanstack/react-router'
import { useLogout } from '@/domains/auth'

/**
 * "Sair do site" of the admin menu: ends the SITE session and goes to the home page. It is not the coins
 * administrator's own sign-out (that one only ends the in-memory access to the coins service).
 */
export function useAdminLogout() {
  const logout = useLogout()
  const navigate = useNavigate()

  return async function adminLogout() {
    try {
      await logout.mutateAsync()
    } catch {
      // The local session is dropped regardless (useLogout's onSettled); an expired token has nothing left to revoke.
    }
    await navigate({ to: '/' })
  }
}
