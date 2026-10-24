import { SpinnerIcon } from '@/shared/icons'

export function PendingState() {
  return (
    <div role="status" className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card py-16 text-center">
      <SpinnerIcon aria-hidden="true" className="size-8 animate-spin text-primary" />
      <p className="text-title font-bold">Confirmando sua transação…</p>
      <p className="max-w-sm text-muted-foreground">Isso pode levar alguns instantes. Esta página atualiza automaticamente.</p>
    </div>
  )
}
