import { AlertTriangle } from 'lucide-react'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  error: unknown
  title?: string
  onRetry?: () => void
  isRetrying?: boolean
}

export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (error instanceof ApiError) return error.message
  return fallback
}

export function ErrorState({ error, title = 'Não foi possível carregar', onRetry, isRetrying }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-sm border border-border bg-card px-6 py-10 text-center">
      <AlertTriangle className="size-6 text-primary" aria-hidden="true" />
      <p className="font-bold">{title}</p>
      <p className="text-sm text-muted-foreground">{errorMessage(error)}</p>
      {onRetry && (
        <Button onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? 'Tentando…' : 'Tentar novamente'}
        </Button>
      )}
    </div>
  )
}
