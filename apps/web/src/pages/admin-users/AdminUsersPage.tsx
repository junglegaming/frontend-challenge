import { useState } from 'react'
import { useAdminLogout } from '@/domains/admin'
import { AdminSideMenu } from '@/shared/ui/admin-side-menu'
import { PageContainer } from '@/shared/ui/page-container'
import { UserDetailPanel } from './components/UserDetailPanel'
import { UserSearch } from './components/UserSearch'

export function AdminUsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const logout = useAdminLogout()

  return (
    <PageContainer className="grid gap-8 py-8 lg:grid-cols-[310px_1fr]">
      <AdminSideMenu active="users" onLogout={logout} />
      <section aria-labelledby="admin-users-title" className="flex flex-col gap-6">
        <div>
          <h1 id="admin-users-title" className="text-title font-bold">
            Usuários
          </h1>
          <p className="text-muted-foreground">Busque contas, veja detalhes e suspenda ou reative o acesso.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <UserSearch onSelect={setSelectedUserId} />
          {selectedUserId && <UserDetailPanel key={selectedUserId} userId={selectedUserId} />}
        </div>
      </section>
    </PageContainer>
  )
}
