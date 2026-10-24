# Contract: Admin Products (`pages/admin-products`, rota `/admin/products`, admin-only)

## Acesso

- `beforeLoad: ({ location, context }) => requireRole(location.href, context, 'admin')`.
- Visitante não-autenticado → redireciona para `/login?redirect=/admin/products` (via
  `requireSession`, reaproveitado dentro de `requireRole`).
- Colecionador autenticado (não-admin) → redireciona para `/` com `?forbidden=true` (FR-004); nunca
  monta o componente da página.

## Endpoints novos (admin-only; `requireAdmin` em cada handler)

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/api/admin/nfts` | — | Lista paginada de NFTs (reaproveita o contrato `Page<NftSummary>` já existente) |
| POST | `/api/admin/nfts` | `CreateListingRequest` | `Nft` criado (201) |
| PATCH | `/api/admin/nfts/:nftId/editions/:editionId` | `UpdateEditionRequest` | `Nft` atualizado — emite `nft.updated` |
| POST | `/api/admin/nfts/:nftId/delist` | — | `Nft` atualizado (status não mais listado publicamente) |

Qualquer chamada com um Bearer token de usuário não-admin responde `403 FORBIDDEN`
(`errors.forbidden()`, já existente).

## Tela

- Tabela/lista de NFTs com ações "Editar" (preço/estoque) e "Remover da vitrine".
- Formulário de criação: nome, categoria, descrição, coleção, edição inicial (nome, preço, estoque,
  limite por pedido), e um botão "Gerar imagem com IA" (ver `media-generation.md`) que preenche o
  campo de imagem com o resultado.
- Após remover um anúncio, ele deixa de aparecer no catálogo público (`/`, `/market`) mas
  continua visível em qualquer pedido que já o referenciava (sem cascata).
