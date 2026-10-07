import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'

export function NftNotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">NFT não encontrado</h1>
      <p className="text-muted-foreground">Este NFT não existe ou foi removido do catálogo.</p>
      <Button asChild>
        <Link to="/">Voltar ao catálogo</Link>
      </Button>
    </section>
  )
}
