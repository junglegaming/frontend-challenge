import { nfts } from "@/data/nfts";
import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

export function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = query
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

  const filteredNfts = useMemo(
    () =>
      nfts
        .filter((nft) => {
          const searchableText = `${nft.name} ${nft.collection} ${nft.category}`
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("pt-BR");

          return searchableText.includes(normalizedQuery);
        })
        .slice(0, 6),
    [normalizedQuery],
  );

  function closeSearch() {
    setIsOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      <div
        className={`flex h-10 items-center rounded-control transition-all duration-200 ${
          isOpen ? "w-48 border border-border sm:w-64" : "w-10"
        }`}
      >
        <button
          type="button"
          aria-label={isOpen ? "Fechar pesquisa" : "Pesquisar NFTs"}
          aria-expanded={isOpen}
          onClick={() => (isOpen ? closeSearch() : setIsOpen(true))}
          className="flex size-10 shrink-0 items-center justify-center rounded-control p-2 text-foreground transition-colors hover:bg-surface-raised"
        >
          {isOpen ? <X className="size-5" /> : <Search className="size-5" />}
        </button>

        {isOpen && (
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar..."
            aria-label="Pesquisar NFTs"
            className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-foreground outline-none ring-0 placeholder:text-muted focus:border-0 focus:outline-none focus:ring-0"
          />
        )}
      </div>

      {isOpen && normalizedQuery && (
        <div className="absolute right-0 top-12 z-50 max-h-80 w-48 overflow-y-auto rounded-card border border-border bg-surface p-2 shadow-lg scrollbar-thin scrollbar-thumb-border-strong scrollbar-track-surface hover:scrollbar-thumb-primary sm:w-64">
          {filteredNfts.length > 0 ? (
            <div className="space-y-1">
              {filteredNfts.map((nft) => (
                <Link
                  key={nft.id}
                  to="/market"
                  search={{ nftId: nft.id }}
                  onClick={closeSearch}
                  className="flex items-center gap-3 rounded-control p-2 text-sm text-foreground transition-colors hover:bg-surface-raised"
                >
                  <img
                    src={nft.image}
                    alt=""
                    className="size-10 shrink-0 rounded-control object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{nft.name}</p>
                    <p className="truncate text-xs text-muted">
                      {nft.collection}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-5 text-center">
              <Search className="size-5 text-muted" />
              <p className="text-sm font-medium text-foreground">
                Nenhum NFT encontrado
              </p>
              <p className="text-xs text-muted">
                Tente pesquisar por outro termo.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
