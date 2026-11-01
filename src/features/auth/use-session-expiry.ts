import { useEffect } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'

import { toast } from 'sonner'

import { setSessionExpiredHandler } from '@/shared/api/http-client'
import { clearSession, getToken } from '@/shared/session'

/**
 * Trata a sessão que expira durante a navegação ou o checkout: limpa a sessão
 * e os dados privados em cache, avisa o usuário e reavalia as rotas. Os
 * guardas das rotas privadas levam ao login com `?redirect=`, então o usuário
 * retoma de onde parou (o carrinho fica no servidor, por usuário).
 */
export function useSessionExpiryHandler(): void {
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    setSessionExpiredHandler(() => {
      // Várias requisições podem falhar juntas: só a primeira age.
      if (!getToken()) return
      clearSession()
      queryClient.clear()
      toast.warning('Sua sessão expirou. Entre novamente para continuar de onde parou.')
      void router.invalidate()
    })
    return () => setSessionExpiredHandler(null)
  }, [queryClient, router])
}
