import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'

export function NotFoundState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card py-16 text-center">
      <p className="text-title font-bold">Pedido não encontrado</p>
      <p className="max-w-sm text-muted-foreground">Verifique o link ou acesse seus pedidos a partir da sua conta.</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  )
}
