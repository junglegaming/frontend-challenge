import { useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { NftListParams } from '@/schemas/nft'

/** Estado do catálogo vive na URL. Qualquer mudança de filtro volta para a página 1. */
export function useCatalogSearch() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })

  const update = useCallback(
    (patch: Partial<NftListParams>, options: { replace?: boolean; keepPage?: boolean } = {}) =>
      navigate({
        search: (prev) => {
          const next = { ...prev, ...patch }
          if (!options.keepPage) delete next.page
          // Remove chaves vazias para manter a URL limpa e a query key estável.
          for (const key of Object.keys(next) as (keyof NftListParams)[]) {
            const value = next[key]
            if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) delete next[key]
          }
          return next
        },
        replace: options.replace,
        resetScroll: false,
      }),
    [navigate],
  )

  const reset = useCallback(
    () => navigate({ search: {}, replace: false, resetScroll: false }),
    [navigate],
  )

  return { search, update, reset }
}

export function toggleValue<T>(list: T[] | undefined, value: T): T[] {
  const current = list ?? []
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
}
