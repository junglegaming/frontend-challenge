import { AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/ui/button'

export function NftLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <section role="alert" className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <AlertTriangle aria-hidden="true" className="size-10 text-destructive" />
      <h1 className="text-2xl font-semibold">Não foi possível carregar este NFT</h1>
      <p className="text-muted-foreground">Verifique sua conexão e tente novamente.</p>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </section>
  )
}
