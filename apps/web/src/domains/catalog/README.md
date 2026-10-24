# Domínio `catalog`

NFTs, edições, busca e filtros. Usado pelas páginas `home`, `nft-detail` e `cart`.

- `model/`: contratos (`Nft`, `NftEdition`, `NftSummary`), categorias e schema de busca da URL
- `api/`: chamadas Axios e `catalogQueries` (query keys/options)
- `hooks/`: aplicação de `nft.updated` no cache (catálogo, detalhe)
- `components/`: `NftCard`, `NftCardSkeleton` e outros reutilizados por mais de uma página
