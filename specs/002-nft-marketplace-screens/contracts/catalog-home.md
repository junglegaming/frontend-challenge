# Contract: Home / Catálogo (`pages/home`, rota `/`)

## Estado na URL (`CatalogQuery`, ver data-model.md)

| Param | Controle | Reset de página |
|---|---|---|
| `q` | busca (navbar mobile / campo desktop) | sim |
| `category[]` | facetos de coleção (checkbox list, sidebar desktop / sheet mobile) | sim |
| `availability` | toggle "Todos os NFTs" / disponíveis | sim |
| `minPrice`, `maxPrice` | `slider` de faixa de preço + botão "Aplicar" | sim |
| `sort` | `select` "Ordenar por" | não |
| `page` | paginação numérica | — |

Qualquer mudança em `q`/`category`/`availability`/`minPrice`/`maxPrice` MUST voltar `page` para `1`.

## Layout

- **Desktop (≥1024 px)**: sidebar de filtros fixa à esquerda + grade 3 colunas + bloco "NFT em
  destaque" + banners + "Diário da Cunhagem" + newsletter, conforme `Início.png`.
- **Mobile (390 px)**: barra de busca + botão de filtro abre um `Sheet` com o mesmo conteúdo da
  sidebar; grade 2 colunas; `Dock` fixa no rodapé (Início/Favoritos/Carrinho/Conta), conforme
  `Início.png` (Mobile).

## Estados

| Estado | Comportamento |
|---|---|
| Carregando | `Skeleton` nos cartões preservando dimensões finais |
| Vazio (0 resultados) | mensagem explícita + ação para limpar filtros (edge case do spec) |
| Erro de rede | mensagem com ação de retry |
| Atualização em tempo real | cartão já renderizado atualiza preço/disponibilidade via `nft.updated`; eventos com `version` ≤ já exibida MUST ser ignorados |

## Ações do cartão de NFT

- Adicionar ao carrinho → `domains/cart` `AddCartItemRequest`.
- Favoritar/desfavoritar → `domains/favorites` (já implementado, otimista).
- Abrir detalhe → navega para `/nft/$nftId` (já implementado).

## Acessibilidade

- Facetos e slider com `Label` associado; slider navegável por teclado (setas) com valor atual
  anunciado.
- Paginação com `aria-current="page"` no item ativo.
