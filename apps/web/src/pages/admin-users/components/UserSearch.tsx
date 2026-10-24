import { useState } from 'react'
import { useAdminUsers } from '@/domains/admin'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'

export function UserSearch({ onSelect }: { onSelect: (userId: string) => void }) {
  const [q, setQ] = useState('')
  const users = useAdminUsers(q || undefined)

  return (
    <div className="flex flex-col gap-3">
      <Input
        aria-label="Buscar por nome ou e-mail"
        placeholder="Buscar por nome ou e-mail"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {users.isPending && <Skeleton className="h-32 w-full" />}

      {users.data && users.data.length === 0 && <p className="text-muted-foreground">Nenhum usuário encontrado.</p>}

      {users.data && users.data.length > 0 && (
        <ul aria-label="Resultados da busca" className="flex flex-col gap-2">
          {users.data.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => onSelect(user.id)}
                className="flex w-full items-center justify-between rounded-sm border border-border p-3 text-left hover:bg-muted focus-visible:outline-3 focus-visible:outline-ring"
              >
                <span>
                  <span className="block font-bold">{user.name}</span>
                  <span className="block text-caption text-muted-foreground">{user.email}</span>
                </span>
                <span className="text-caption text-muted-foreground">
                  {user.role === 'admin' ? 'Administrador' : 'Colecionador'} · {user.status === 'active' ? 'Ativo' : 'Suspenso'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
