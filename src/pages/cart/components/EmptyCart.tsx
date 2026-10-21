import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card py-16 text-center">
      <p className="text-title font-bold">Seu carrinho está vazio</p>
      <p className="max-w-sm text-muted-foreground">Explore o catálogo e adicione NFTs para continuar.</p>
      <Button asChild>
        <Link to="/">Ver catálogo</Link>
      </Button>
    </div>
  )
}
