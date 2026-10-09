import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/useDebounce';
import SearchIcon from '@/assets/search.svg?react';

export function SearchInput({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (q: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const debouncedSearch = useDebounce(onSearch);

  if (value !== previousValue) {
    setPreviousValue(value);
    setDraft(value);
  }

  return (
    <form
      role="search"
      className="flex min-w-0 flex-1 gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        debouncedSearch.cancel();
        onSearch(draft.trim());
      }}
    >
      <div className="text-secondary relative min-w-0 flex-1">
        <SearchIcon
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
        />
        <Input
          type="search"
          aria-label="Buscar NFTs"
          placeholder="Explorar coleções"
          className="bg-surface-card text-secondary text-body-bold md:text-body-bold h-11.25 border-none pl-10"
          value={draft}
          onChange={(event) => {
            const nextValue = event.target.value;
            setDraft(nextValue);
            debouncedSearch(nextValue.trim());
          }}
        />
      </div>
      <Button type="submit" variant="outline" className="hidden md:inline-flex">
        Buscar
      </Button>
    </form>
  );
}
