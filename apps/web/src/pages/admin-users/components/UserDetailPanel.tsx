import { useState } from 'react'
import { toast } from 'sonner'
import { useAdminUser, useReactivateUser, useSuspendUser } from '@/domains/admin'
import { isApiError } from '@/shared/api/http'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export function UserDetailPanel({ userId }: { userId: string }) {
  const user = useAdminUser(userId)
  const suspendUser = useSuspendUser()
  const reactivateUser = useReactivateUser()
  const [suspendError, setSuspendError] = useState<string | null>(null)

  function suspend() {
    setSuspendError(null)
    suspendUser.mutate(userId, {
      onSuccess: () => toast.success('Conta suspensa.'),
      onError: (error) => {
        const message = isApiError(error) ? error.message : 'Não foi possível suspender esta conta.'
        setSuspendError(message)
        toast.error(message)
      },
    })
  }

  function reactivate() {
    reactivateUser.mutate(userId, {
      onSuccess: () => toast.success('Conta reativada.'),
      onError: (error) => toast.error(isApiError(error) ? error.message : 'Não foi possível reativar esta conta.'),
    })
  }

  if (user.isPending) return <Skeleton className="h-48 w-full" />
  if (user.isError) return <p className="text-muted-foreground">Não foi possível carregar este usuário.</p>

  const data = user.data

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
      <div>
        <h2 className="text-title font-bold">{data.name}</h2>
        <p className="text-muted-foreground">{data.email}</p>
        <p className="text-caption text-muted-foreground">
          {data.role === 'admin' ? 'Administrador' : 'Colecionador'} · {data.status === 'active' ? 'Ativo' : 'Suspenso'}
        </p>
      </div>

      {data.status === 'active' ? (
        <Button variant="outline" disabled={suspendUser.isPending} onClick={suspend} className="self-start">
          Suspender
        </Button>
      ) : (
        <Button disabled={reactivateUser.isPending} onClick={reactivate} className="self-start">
          Reativar
        </Button>
      )}

      {suspendError && (
        <p role="alert" className="text-caption text-destructive">
          {suspendError}
        </p>
      )}
    </div>
  )
}
