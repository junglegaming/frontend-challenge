import { useCallback, useEffect, useRef, useState } from 'react'

const DEBOUNCE_MS = 300

/**
 * Rascunho de busca ligado ao `q` da URL: aplica 300 ms depois da digitação (ou já, com `commit`)
 * e acompanha o `q` quando ele muda por fora (voltar, limpar filtros) sem sobrescrever o que está sendo digitado.
 */
export function useDebouncedSearch(urlQ: string, apply: (q: string) => void) {
  const [value, setValue] = useState(urlQ)
  const applied = useRef(urlQ)

  useEffect(() => {
    if (urlQ === applied.current) return
    applied.current = urlQ
    setValue(urlQ)
  }, [urlQ])

  const commitValue = useCallback(
    (next: string) => {
      const q = next.trim()
      if (q === applied.current) return
      applied.current = q
      apply(q)
    },
    [apply],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => commitValue(value), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [value, commitValue])

  return { value, setValue, commit: () => commitValue(value) }
}
