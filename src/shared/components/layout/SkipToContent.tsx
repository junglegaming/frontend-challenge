/** Props de {@link SkipToContent}. */
interface SkipToContentProps {
  /** Id do elemento `main` que recebe o foco. Padrão: `conteudo`. */
  targetId?: string
}

/**
 * Link "pular para o conteúdo": primeiro item focável da página, visível só ao
 * receber foco, para que usuários de teclado/leitor de tela evitem o header.
 *
 * O alvo precisa de `tabIndex={-1}` para receber o foco programático do âncora.
 *
 * @param props - {@link SkipToContentProps}
 * @returns Âncora para o `main` da página.
 * @example
 * <SkipToContent />
 * <Header />
 * <main id="conteudo" tabIndex={-1}>…</main>
 */
export function SkipToContent({ targetId = 'conteudo' }: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-[5px] bg-primary px-4 py-2 text-sm font-bold text-ink shadow-button focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:outline-2 focus:outline-offset-2 focus:outline-canvas"
    >
      Pular para o conteúdo
    </a>
  )
}
