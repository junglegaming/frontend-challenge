import { AlertIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'

export function NftLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <PageContainer className="flex max-w-xl flex-col items-center gap-4 py-24 text-center" role="alert">
      <AlertIcon aria-hidden="true" strokeWidth={1.5} className="size-10 text-destructive" />
      <h1 className="text-title font-bold">Não foi possível carregar este NFT</h1>
      <p className="text-muted-foreground">Verifique sua conexão e tente novamente.</p>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </PageContainer>
  )
}
