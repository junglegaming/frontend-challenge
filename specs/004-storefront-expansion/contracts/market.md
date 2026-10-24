# Contract: Mercado (`pages/market`, rota `/market`, pública)

## Fontes de dados (sem endpoint novo)

- Ladrilhos de categoria: lista fixa `NFT_CATEGORIES`/`CATEGORY_LABELS`, já exportada por
  `@/domains/catalog`.
- Faixa "em alta": `catalogQueries.featured()`, já existente — mesmos dados usados hoje na home.
- Faixa "coleções": agrupamento no cliente do resultado de `catalogQueries.featured()` (ou de uma
  busca ampla, se `featured()` não tiver amostra suficiente) por `Nft.collection`, mostrando até N
  coleções com pelo menos 1 item.

## Navegação (sem grid/paginação própria)

| Ação | Destino |
|---|---|
| Selecionar um ladrilho de categoria | `/` com `?category=<id>` pré-definido |
| Selecionar um item da faixa "em alta" | `/nft/$nftId` (detalhe do NFT) |
| Selecionar uma coleção na faixa "coleções" | `/` com `?q=<nome-da-coleção>` pré-definido (reaproveita a busca textual já existente na home) |

## Estados

- Carregando: skeletons com shimmer, mesmo padrão das demais telas (Princípio VI).
- Vazio por faixa: se `featured()` retornar vazio, a faixa "em alta" mostra um estado vazio
  explícito; o restante da tela (ladrilhos de categoria) continua renderizando normalmente.
- Erro: se a consulta subjacente falhar, reaproveita o mesmo padrão de estado de erro com retry já
  usado no catálogo (`NftGridError`), sem introduzir um estado de erro novo.
