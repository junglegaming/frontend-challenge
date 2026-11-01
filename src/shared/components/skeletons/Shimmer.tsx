import { cn } from '@/shared/lib/cn'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Bloco de carregamento com brilho deslizante (shimmer), base de todos os
 * skeletons do Kurio. É decorativo: sempre `aria-hidden`, cabendo ao container
 * anunciar o carregamento.
 *
 * Sob `prefers-reduced-motion`, o brilho some e resta só o bloco estático.
 *
 * @param props - Props de `div`; `className` define tamanho, raio e cor de fundo.
 * @returns Bloco `div` decorativo.
 * @example
 * <Shimmer className="h-4 w-32 rounded-[4px]" />
 */
export function Shimmer({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <Skeleton
      aria-hidden="true"
      className={cn(
        // `animate-none` desliga o pulse padrão do shadcn: o shimmer o substitui.
        'relative animate-none overflow-hidden bg-surface-raised',
        'before:absolute before:inset-0 before:animate-shimmer before:bg-linear-to-r before:from-transparent before:via-sand/20 before:to-transparent',
        'motion-reduce:before:hidden',
        className,
      )}
      {...props}
    />
  )
}
