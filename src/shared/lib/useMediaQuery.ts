import { useSyncExternalStore } from 'react'

/**
 * Acompanha uma media query CSS. Use quando as versões mobile e desktop de uma
 * tela têm comportamento diferente (não só visual) — por exemplo, campos que
 * só existem num dos layouts.
 *
 * @param query - Media query, ex.: `(min-width: 768px)`.
 * @returns Se a query corresponde no momento.
 * @example
 * const isDesktop = useMediaQuery('(min-width: 768px)')
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
