import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'

/** Fallback de erro inesperado de renderização ou carregamento de rota: nunca derruba o app inteiro. */
export function RouteError({ reset }: ErrorComponentProps) {
  const router = useRouter()

  const retry = () => {
    reset()
    void router.invalidate()
  }

  return (
    <PageContainer className="flex flex-col items-center gap-4 py-24 text-center">
      <AlertTriangle className="size-8 text-primary" aria-hidden="true" />
      <h1 className="text-2xl font-bold">Algo deu errado nesta tela</h1>
      <p role="alert" className="max-w-md text-muted-foreground">
        Não conseguimos exibir este conteúdo. Seus dados estão preservados. Tente novamente ou volte ao início.
      </p>
      <div className="flex gap-3">
        <Button onClick={retry}>Tentar novamente</Button>
        <Button variant="outline" asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </PageContainer>
  )
}
