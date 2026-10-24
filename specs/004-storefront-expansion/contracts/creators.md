# Contract: Criadores (`pages/creators` + `pages/creator-detail`, rotas `/creators` e `/creators/$creatorId`, públicas)

## Endpoints novos (somente leitura, projeção sobre `CatalogRepository`)

| Método | Rota | Resposta | Uso |
|---|---|---|---|
| GET | `/api/creators` | `Creator[]` (ver data-model.md) | Grid do diretório (`CreatorsPage`) |
| GET | `/api/creators/:id` | `Creator` ou 404 | Cabeçalho/bio do detalhe (`CreatorDetailPage`) |
| GET | `/api/creators/:id/nfts` | `NftSummary[]` (tipo já existente do domínio `catalog`) | Grid de NFTs do criador no detalhe |

Todos derivados em tempo de requisição a partir do estado já existente do catálogo — nenhum dado
novo é persistido ou seedado.

## Diretório (`/creators`)

- Grid de `CreatorCard`: avatar, nome, contagem de NFTs (`nftCount`).
- Selecionar um card navega para `/creators/$creatorId`.
- Estado vazio: se não houver nenhum criador (catálogo vazio), mostra um estado vazio explícito, não
  um grid em branco.

## Detalhe (`/creators/$creatorId`)

- `CreatorBio`: avatar, nome, bio (ver research.md D3).
- Grid de NFTs do criador, reaproveitando `NftCard` (mesmo componente usado na home/catálogo).
- `id` inexistente → GET `/api/creators/:id` responde 404 (`NOT_FOUND`, mesmo contrato de erro já
  usado em outros endpoints) → a página renderiza o mesmo padrão de "não encontrado" já usado em
  `order-confirmation`/`nft-detail` para um recurso ausente.
