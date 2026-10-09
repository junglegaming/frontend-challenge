# Contrato — NFTs (catálogo e detalhe)

## Modelo

```ts
type Nft = {
  id: string; // "golden-signal-160"
  name: string; // "Golden Signal #160"
  collection: string; // "Kurio Editions"
  creator: { id: string; name: string };
  edition: { current: number; total: number }; // ex.: { current: 1, total: 10 }
  price: string; // ETH decimal, ex.: "0.99"
  previousPrice?: string; // presente quando houve queda (mostra badge coral)
  network: 'ethereum' | 'polygon' | 'solana'; // rede do catálogo, independente de carteira/checkout
  categories: string[]; // ["Arte digital", "Fotografia", "Música", "Arte 3D", "Utilidade"]
  image: string; // "/assets/nft/golden-signal-160.png"
  images: string[]; // galeria (mín. 1; usa as 4 imagens do Figma)
  description: string;
  tokenId?: string; // identificador do token, ex.: "0042"
  details?: string; // descrição ampliada, parágrafos separados por \n
  contract?: {
    address: string;
    standard: string; // ex.: "ERC-721"
    verified: boolean;
    royalties: string; // percentual decimal, ex.: "5"; apresentação sem cálculo
  };
  reviews?: {
    average: number; // 0–5
    count: number; // inteiro >= 0; total, pode superar a amostra em items
    items: {
      id: string;
      author: string;
      rating: number;
      comment: string;
      date: string;
    }[];
    // rating: 0–5; date: ISO; avaliações somente leitura
  };
  editable: boolean; // false → "edição indisponível" no detalhe
  available: number; // exemplares disponíveis (0 → esgotado)
  favoritesCount: number;
  rarity?: 'RARO' | 'COMUM' | 'ÚNICO';
  attributes?: { trait: string; value: string }[];
  version: number; // incrementa a cada nft.updated (dedupe socket)
  updatedAt: string; // ISO
  createdAt: string; // ISO — usado no sort "recent"
};
```

Campos adicionais são opcionais para compatibilidade com dados persistidos antigos.
Blocos sem dados são omitidos; avaliações vazias têm feedback explícito.
`editable: false` bloqueia quantidade e compra, mesmo com estoque. As opções de
edição na interface são informativas: apenas a edição deste NFT está disponível.

## Endpoints

### `GET /api/nfts` — listagem (pública)

`favoritesOnly=true` restringe a listagem aos favoritos do usuário autenticado
antes da ordenação e paginação, combinando com todos os outros filtros.
Aceita booleano ou strings `true`/`false`; ausente ou `false` mantém a listagem
pública. Valor inválido retorna 422; `true` sem sessão válida retorna 401.
As facetas continuam globais.

| Query                   | Tipo                | Default     | Notas                                                                                           |
| ----------------------- | ------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `q`                     | string              | —           | casa `name`, `collection`, `creator.name`, case-insensitive; sem resultados → `items: []` (200) |
| `categories`            | string[] (repetido) | —           | AND entre categorias selecionadas: `?categories=Arte digital&categories=Música`                 |
| `networks`              | string[] (repetido) | —           | OR entre `ethereum`, `polygon`, `solana`; AND com demais filtros; inválido → 422                |
| `minPrice` / `maxPrice` | string (ETH)        | —           | inclusive; `min > max` → 422                                                                    |
| `sort`                  | enum                | `relevance` | `relevance` \| `recent` \| `price_asc` \| `price_desc` \| `popular`                             |
| `page`                  | number ≥ 1          | 1           | página além do total → `items: []` com `total` real                                             |
| `pageSize`              | number 1–48         | 12          |                                                                                                 |

```jsonc
// 200 OK
{
  "items": [/* Nft[] (sem necessidade de campos pesados: full model aceito) */],
  "facets": {
    "categories": [
      { "id": "Arte digital", "count": 33 } /* todas as nove categorias */,
    ],
    "networks": [{ "id": "ethereum", "count": 22 } /* todas as três redes */],
  },
  "page": 1,
  "pageSize": 12,
  "total": 64,
}
```

Erros: `422 VALIDATION_ERROR` (parâmetros inválidos), `500 INTERNAL` (cenário de falha).

**Regras:** filtros são **combináveis** (AND); qualquer mudança de filtro/sort no cliente
reseta `page` para 1; a resposta reflete exatamente os parâmetros enviados.

### `GET /api/nfts/:id` — detalhe (pública)

```jsonc
// 200 OK → Nft
// 404 NOT_FOUND  { "error": { "code": "NOT_FOUND", "message": "NFT não encontrado" } }
```

Acesso direto por URL é obrigatório: rota inexistente no mock → página 404 do app;
NFT removido depois de listado → `404` com estado vazio amigável + link ao catálogo.

## Fixtures

- **60+ NFTs** determinísticos (ids, preços e datas fixos) espalhados em ≥ 5 categorias,
  preços entre `0.02` e `12.30` ETH, edições (`1/10`, `1/50`, `1/1`…) — suficientes para
  exercitar filtros combinados e ~6 páginas de paginação.
- 4 imagens PNG (1254×1254) do arquivo Figma em `public/assets/nft/`, distribuídas
  entre os NFTs; nomes de exibição seguem o padrão do layout
  (`Golden Signal #160`, `Sage Nomad #009`, `Golden Frequency #071`, `Violet Nomad #314`,
  `Golden Beat #207`, coleção `Kurio Editions` / `Kurio Apes`).
- Campos `version` iniciam em `1` e sobem com eventos `nft.updated`.
- Avaliações determinísticas no catálogo e detalhe: `golden-signal-160` tem média
  4.5 (notas 5 e 4), `sage-nomad-009` tem média 5, `golden-frequency-071`
  tem média 3.5, `violet-nomad-314` tem média 1.5 e `golden-beat-207`
  tem média 0.5 (inclui nota zero). Cada um tem duas avaliações com autor,
  comentário e data ISO. `kurio-teal-motion-008` omite `reviews`;
  `kurio-ruby-circuit-009` retorna `{ average: 0, count: 0, items: [] }`.
  O Emerald Ape preserva média 4.8 e total 19 com amostra de duas avaliações.
  Para carregar o seed atualizado em um navegador com dados persistidos, use
  **Reset cenário** ou `?reset=1`.

## Facetas globais

Contagens sobre todo o catálogo disponível antes de busca, filtros, ordenação e paginação. Cada NFT conta uma vez por categoria e uma vez na sua rede. Todas as nove categorias e três redes são retornadas, inclusive com zero. No cenário vazio, todas são zero. Os números acima são ilustrativos; a UI usa exclusivamente a API.

### Seleção na interface

O painel Coleções permite no máximo uma categoria: selecionar outra substitui a anterior; desmarcar remove o filtro. URLs antigas com várias categorias são normalizadas pelo cliente para a primeira categoria não vazia. O endpoint REST mantém suporte a múltiplas categorias para compatibilidade. Redes continuam permitindo seleção múltipla.
