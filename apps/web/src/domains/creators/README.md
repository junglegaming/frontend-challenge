# Domínio `creators`

Perfil de criador, derivado inteiramente dos NFTs já existentes no catálogo (agrupados por
`artist.id`) — não há estado próprio nem persistência nova. A bio é um texto curto fixo mantido
somente na camada de mocks (ver `specs/004-storefront-expansion/research.md`, D2/D3).

**Público**: `Creator` (model), `creatorQueries.list()/.detail(id)/.nfts(id)` (TanStack Query).

**Usado por**: `pages/creators`, `pages/creator-detail`.
