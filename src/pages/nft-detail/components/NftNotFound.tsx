import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'
import { PageContainer } from '@/shared/ui/page-container'

export function NftNotFound() {
  return (
    <PageContainer className="flex max-w-xl flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-title font-bold">NFT não encontrado</h1>
      <p className="text-muted-foreground">Este NFT não existe ou foi removido do catálogo.</p>
      <Button asChild>
        <Link to="/">Voltar ao catálogo</Link>
      </Button>
    </PageContainer>
  )
}
