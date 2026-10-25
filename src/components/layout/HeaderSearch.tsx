import { useCallback, useEffect, useRef } from 'react'
import { useMatch, useNavigate } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'

interface HeaderSearchProps {
  onClose: () => void
}

/** Campo de busca do header (desktop). Na home, o `q` da URL preenche o campo. */
export function HeaderSearch({ onClose }: HeaderSearchProps) {
  const navigate = useNavigate()
  const homeMatch = useMatch({ from: '/', shouldThrow: false })
  const isHome = homeMatch !== undefined
  const inputRef = useRef<HTMLInputElement>(null)

  const apply = useCallback(
    (q: string) => {
      if (isHome) {
        void navigate({
          to: '/',
          search: (prev) => ({ ...prev, q: q || undefined, page: undefined }),
          replace: true,
          resetScroll: false,
        })
      } else {
        void navigate({ to: '/', search: q ? { q } : {}, resetScroll: false })
      }
    },
    [isHome, navigate],
  )
  const { value, setValue, commit } = useDebouncedSearch(homeMatch?.search.q ?? '', apply)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  return (
    <form
      className="mx-10 flex max-w-md flex-1 items-center"
      onSubmit={(event) => {
        event.preventDefault()
        commit()
      }}
    >
      <label htmlFor="catalog-search-desktop" className="sr-only">
        Buscar coleções
      </label>
      <Input
        ref={inputRef}
        id="catalog-search-desktop"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
        placeholder="Buscar coleções"
        className="h-10 rounded-full border-0 bg-card px-4 text-sm placeholder:text-subtle"
        autoComplete="off"
        maxLength={80}
      />
    </form>
  )
}
