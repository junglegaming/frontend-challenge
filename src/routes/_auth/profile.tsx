import { createFileRoute } from '@tanstack/react-router'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/layout/PageContainer'
import { AccountSidebar } from '@/components/profile/AccountSidebar'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton'
import { useProfile } from '@/hooks/useAccount'

export const Route = createFileRoute('/_auth/profile')({
  component: Page,
})

function Page() {
  const profile = useProfile()

  return (
    <PageContainer className="pt-8 pb-16">
      <div className="grid grid-cols-1 gap-7 md:grid-cols-[310px_minmax(0,1fr)]">
        <AccountSidebar />
        <section aria-labelledby="profile-title">
          <h1 id="profile-title" className="text-base font-bold">
            Perfil do colecionador
          </h1>
          <div className="mt-8">
            {profile.isPending && <ProfileSkeleton />}
            {profile.isError && (
              <ErrorState
                error={profile.error}
                title="Não foi possível carregar o perfil"
                onRetry={() => void profile.refetch()}
                isRetrying={profile.isFetching}
              />
            )}
            {profile.data && <ProfileForm profile={profile.data} />}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
