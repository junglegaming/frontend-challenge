import { Link, useNavigate } from '@tanstack/react-router'
import { useLogout } from '@/domains/auth'
import { useProfile } from '@/domains/profile'
import { isApiError } from '@/shared/api/http'
import { AccountSideMenu } from '@/shared/ui/account-side-menu'
import { Button } from '@/shared/ui/button'
import { ProfileForm } from './components/ProfileForm'
import { PageContainer } from '@/shared/ui/page-container'

function FormSkeleton() {
  return (
    <div role="status" aria-label="Carregando perfil" className="grid gap-x-12 gap-y-6 md:grid-cols-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-[68px] animate-shimmer rounded-sm bg-[linear-gradient(90deg,var(--card)_25%,var(--border)_50%,var(--card)_75%)] bg-[length:200%_100%]"
        />
      ))}
    </div>
  )
}

export function ProfilePage() {
  const profile = useProfile()
  const unauthenticated = profile.isError && isApiError(profile.error) && profile.error.isAuthError
  const logout = useLogout()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout.mutateAsync()
    } catch {
      // The local session is dropped regardless (useLogout's onSettled); an expired token has nothing left to revoke.
    }
    await navigate({ to: '/' })
  }

  return (
    <PageContainer className="grid gap-8 py-8 lg:grid-cols-[310px_1fr]">
      <AccountSideMenu active="profile" onLogout={handleLogout} />
      <section aria-labelledby="profile-title">
        <h1 id="profile-title" className="mb-8 text-title font-bold">
          Perfil do colecionador
        </h1>
        {profile.isPending && !profile.isError ? <FormSkeleton /> : null}
        {profile.data && <ProfileForm key={profile.data.id} profile={profile.data} />}
        {profile.isError && (
          <div role="alert" className="flex flex-col items-start gap-4">
            <p>
              {unauthenticated
                ? 'Sua sessão não está ativa. Entre para editar seu perfil.'
                : 'Não foi possível carregar o perfil.'}
            </p>
            {unauthenticated ? (
              <Link to="/" className="text-primary underline">
                Voltar ao início
              </Link>
            ) : (
              <Button onClick={() => profile.refetch()}>Tentar novamente</Button>
            )}
          </div>
        )}
      </section>
    </PageContainer>
  )
}
