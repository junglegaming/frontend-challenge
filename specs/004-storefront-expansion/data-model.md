# Data Model: Storefront Expansion — Mercado, Criadores, Aprenda

No changes to existing entities (`Nft`, `NftEdition`, `Cart`, `Order`, `Wallet` — see
`specs/002-nft-marketplace-screens/data-model.md`). This feature introduces two new, independent
concepts.

## Creator (new — `src/domains/creators/model/contracts.ts`)

A read-only, derived profile for anyone who has listed at least one NFT. Not a new persisted
record — computed from existing catalog data (per research.md D2).

```ts
export interface Creator {
  id: string           // same id as Nft.artist.id
  name: string          // same as Nft.artist.name
  avatarUrl: string | null  // same as Nft.artist.avatarUrl
  bio: string           // short fixed text, see research.md D3 — lives in mock fixtures only
  nftCount: number       // count of currently-listed NFTs with artist.id === this creator's id
}
```

**Derivation rule**: a creator exists in the directory if and only if at least one NFT in the
catalog currently names them as `artist`. `nftCount` reflects only currently-listed (not delisted)
NFTs. Removing every one of a creator's NFTs does not delete the creator record from `/creators` —
they simply show `nftCount: 0` (per spec.md Edge Cases).

**Relationships**: one Creator → many `NftSummary` (the existing catalog entity, unchanged),
queried via `creatorQueries.nfts(id)`.

## Learn Article (new — `src/pages/learn/content/articles.ts`)

Fully static editorial content. Not fetched from any mock endpoint — a plain TypeScript constant
bundled with the app (per research.md D1/spec.md Assumptions: "not user- or transaction-generated
data").

```ts
export interface Article {
  slug: string           // URL-safe unique identifier, e.g. "o-que-sao-nfts"
  title: string
  summary: string         // shown in the list view
  readingMinutes: number
  body: string            // full content shown in the detail view (Markdown-free plain text/paragraphs)
}
```

**Validation rule**: `slug` MUST be unique across the static array (enforced by convention/code
review, not runtime validation, since the array is authored in-repo, not user input).

**Lookup rule**: the `/learn/$slug` route resolves an `Article` by exact `slug` match against the
static array; no match renders the existing not-found pattern (FR-008).
