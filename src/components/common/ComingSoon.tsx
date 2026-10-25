import { cn } from '@/lib/utils'

interface ComingSoonProps {
  children: React.ReactNode
  className?: string
  /** Esmaece o texto; o footer desliga para ficar na mesma cor dos links ativos. */
  muted?: boolean
}

/** Ação fora do escopo do desafio: visível, mas claramente indisponível (nunca simula sucesso). */
export function ComingSoon({ children, className, muted = true }: ComingSoonProps) {
  return (
    <span aria-disabled="true" title="Em breve" className={cn('relative cursor-not-allowed', muted && 'opacity-60', className)}>
      {children}
      <span className="sr-only"> (em breve)</span>
    </span>
  )
}
