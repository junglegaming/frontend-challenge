# Estrutura do Projeto — NFT Marketplace

> Referência de organização do código. Tela/frames citados vêm do arquivo Figma
> `Frontend Challenge` (`Ff0SksUi7UFtPWUO8kyNtw`).
> Estilo visual (cores, tipografia, componentes): ver [`ESTILOS.md`](./ESTILOS.md).

## 1. Diretrizes

- **Feature-first**: código de negócio agrupado por domínio (`features/catalog`, `features/cart`…), não por camada.
- **Rotas file-based** com TanStack Router em `src/routes/` — cada arquivo vira uma rota, com code-split automático.
- **Camada de rede única**: tudo que é REST passa por Axios (`lib/http`); tudo que é tempo real passa por `lib/socket` (socket.io-client). Nada de `fetch` direto, nada de mock dentro de componente/hook.
- **Mock na borda de rede**: MSW intercepta Axios e o Socket.IO — componentes e hooks não sabem que há mock.
- **Contratos tipados**: zod valida search params, payloads de formulário e respostas da API; tipos inferidos (`z.infer`) são a única fonte de verdade.
- **Dinheiro**: valores ETH trafegam como `string` decimal; cálculos via `decimal.js` (`lib/money.ts`). Quantidades são `number` inteiro.

## 2. Árvore de diretórios

```
frontend-challenge/
├── README.md                     # setup, credenciais, cenários, comandos (entrega)
├── ARCHITECTURE.md               # contratos REST, sessão, cache, socket, decisões (entrega)
├── docs/
│   ├── ESTRUTURA.md              # este arquivo
│   ├── ESTILOS.md                # cores, tipografia, componentes reutilizáveis
│   ├── api/                      # contratos REST documentados (request/response/erros)
│   └── figma/                    # saída de `fig:extract` (frames, estilos, JSON de referência)
├── scripts/
│   └── figma-extract.ts          # baixa /v1/files + /v1/images → docs/figma/ e public/
├── audits/
│   ├── lighthouse.config.js      # perfis mobile/desktop, 3 medições
│   └── reports/                  # HTML/JSON versionados
├── tests/
│   ├── contract/            # Vitest — handlers MSW × schemas zod (`pnpm test:contract`)
│   └── e2e/
│       ├── fixtures/             # dados de teste Playwright
│       └── *.spec.ts             # 12 fluxos do enunciado + regressão visual
├── public/
│   ├── assets/nft/               # 4 PNGs (1254²) extraídos do .fig
│   ├── icons/                    # SVGs Iconly exportados do Figma
│   └── fonts/                    # Roboto Mono auto-hospedada (fontsource)
├── index.html
├── vite.config.ts                # React, alias @ → src, MSW, chunks
├── tailwind (via src/styles/global.css — Tailwind v4 @theme)
├── components.json               # config shadcn/ui
├── playwright.config.ts
├── .env.example                  # FIGMA_TOKEN, VITE_MOCK_*, URLs
└── src/
    ├── main.tsx                  # bootstrap: QueryClient, MSW (se VITE_MOCKS), SocketProvider, RouterProvider
    ├── styles/
    │   └── global.css           # @theme tokens (cores/fontes/raios) + utilitários shadcn
    ├── routes/                   # ← file-based router (TanStack Router)
    │   ├── __root.tsx            # layout raiz: Header, Footer, Toaster, ErrorBoundary, Outlet
    │   ├── index.tsx             # /            → Início (catálogo)
    │   ├── nfts.$nftId.tsx       # /nfts/:nftId  → Detalhes do NFT
    │   ├── cart.tsx              # /cart        → Carrinho
    │   ├── checkout.tsx          # /checkout    → Pagamento        (privada)
    │   ├── orders.$orderId.tsx   # /orders/:id  → Confirmação      (privada)
    │   ├── login.tsx             # /login       → Login            (pública, ?redirect=)
    │   ├── signup.tsx            # /signup      → Cadastro         (pública)
    │   ├── profile.tsx           # /profile     → Perfil           (privada)
    │   ├── wallets.tsx           # /wallets     → Carteiras        (privada)
    │   ├── not-found.tsx         # *            → 404
    │   └── (protected)/          # opcional: beforeLoad comum das rotas privadas
    ├── features/                 # um domínio por pasta — autocontida
    │   ├── auth/                 # login, cadastro, sessão
    │   │   ├── components/       #   formulários, guards visuais
    │   │   ├── hooks/            #   useSession, useLogin, useSignup…
    │   │   ├── queries.ts        #   query keys + mutations (Axios)
    │   │   └── types.ts          #   tipos do contrato de sessão
    │   ├── catalog/              # busca, filtros, ordenação, paginação, cards
    │   ├── nft-detail/           # galeria, edição, qtd, favoritos, comprar
    │   ├── favorites/            # mutações otimistas de favorito
    │   ├── cart/                 # itens, quantidades, cupom, resumo, tempo real
    │   ├── checkout/             # formulário, carteira/rede, revisão, envio (idempotência)
    │   ├── orders/               # estado do pedido, recibo (snapshot)
    │   ├── profile/              # dados, avatar, senha
    │   └── wallets/              # carteira principal/secundária
    ├── components/
    │   ├── ui/                   # shadcn/ui adaptado ao tema (button, dialog, sheet…)
    │   ├── icons/                # SVGs Iconly como componentes React
    │   ├── layout/               # Header, MobileNav, Footer, PageContainer
    │   └── shared/               # NFTCard, Price, QuantityStepper, Skeleton, EmptyState,
    │                             # ErrorState, Pagination, StatusBadge, FormField…
    ├── lib/
    │   ├── http/
    │   │   ├── client.ts         # instância Axios + interceptors (auth, 401→sessão expirada)
    │   │   ├── errors.ts         # AxiosError → AppError (union tipada de erros do contrato)
    │   │   └── endpoints.ts      # paths centralizados
    │   ├── query/
    │   │   ├── client.ts         # QueryClient: staleTime, retry, refetchOnWindowFocus
    │   │   └── keys.ts           # query key factory (isola por usuário + params)
    │   ├── socket/
    │   │   ├── client.ts         # criação/reconexão do socket.io-client
    │   │   ├── events.ts         # tipos de nft.updated / order.updated + versão
    │   │   └── reconcile.ts      # dedupe/ordem + refetch REST pós-reconexão
    │   ├── session/
    │   │   ├── context.tsx       # provider de sessão (token, usuário, expiração)
    │   │   └── guards.ts         # beforeLoad das rotas privadas + redirect pós-login
    │   ├── money.ts              # ETH string ⇄ decimal.js (sub, add, cmp, format)
    │   └── utils.ts              # cn(), formatação de data, helpers puros
    ├── mocks/
    │   ├── browser.ts            # worker MSW (dev/demo)
    │   ├── server.ts             # server MSW (testes)
    │   ├── handlers/
    │   │   ├── session.ts        # cadastro, login, sessão, logout, expiração
    │   │   ├── nfts.ts           # listagem (busca/filtros/ordem/página) + detalhe
    │   │   ├── favorites.ts
    │   │   ├── cart.ts
    │   │   ├── quote.ts          # cupom, disponibilidade, desconto, taxas, total
    │   │   ├── orders.ts         # criação idempotente + consulta/recibo
    │   │   ├── profile.ts
    │   │   └── wallets.ts
    │   ├── db/
    │   │   ├── store.ts          # estado em memória (nfts, users, cart, orders…)
    │   │   ├── persist.ts        # localStorage + hidratação (sobrevive refresh)
    │   │   └── reset.ts          # restaura cenário conhecido
    │   ├── fixtures/              # nfts (60+), users (2), coupons, wallets, orders
    │   ├── scenarios/            # rede lenta, timeout, 4xx/5xx, offline, sessão expirada…
    │   └── sockets/
    │       └── handlers.ts       # eventos Socket.IO via @mswjs/socket.io-binding
    └── types/
        └── api.ts                # tipos compartilhados de contrato (re-export z.infer)
```

## 3. Mapa de rotas

| Rota | Arquivo | Tela | Acesso | Frame Desktop | Frame Mobile |
| --- | --- | --- | --- | --- | --- |
| `/` | `routes/index.tsx` | Início — destaques, catálogo, busca, filtros, ordenação | pública | `2:2` (1440×3668) | `14:5226` (414×896) |
| `/nfts/$nftId` | `routes/nfts.$nftId.tsx` | Detalhes do NFT | pública | `10:244` (1440×2246) | `15:5536` |
| `/cart` | `routes/cart.tsx` | Carrinho | pública (funciona para visitante) | `11:1278` (1440×1754) | `16:360` |
| `/checkout` | `routes/checkout.tsx` | Pagamento | **privada** | `11:2862` (1440×1657) | `16:748` |
| `/orders/$orderId` | `routes/orders.$orderId.tsx` | Confirmação / recibo | **privada** | `11:4385` (1440×1657) | *sem frame — seguir padrão mobile* |
| `/login` | `routes/login.tsx` | Login (`?redirect=` retorna ao fluxo) | pública | `9:115` (1440×1981) | `16:1022` |
| `/signup` | `routes/signup.tsx` | Cadastro | pública | `9:1022` (1440×1981) | `16:1228` |
| `/profile` | `routes/profile.tsx` | Perfil do colecionador | **privada** | `9:1238` (1440×1080) | *sem frame — seguir padrão mobile* |
| `/wallets` | `routes/wallets.tsx` | Carteiras | **privada** | `9:1670` (1440×1080) | *sem frame — seguir padrão mobile* |
| `*` | `routes/not-found.tsx` | 404 | — | — | — |

### Search params da rota `/` (componem a URL e sobrevivem a refresh/histórico)

Validados com zod em `features/catalog/search-params.ts`:

| Param | Tipo | Observação |
| --- | --- | --- |
| `q` | `string?` | busca textual |
| `categories` | `string[]?` | filtros combináveis (ex.: `Arte digital`, `Fotografia`…) |
| `minPrice` / `maxPrice` | `string?` | ETH decimal |
| `sort` | enum? | relevância, preço asc/desc, mais recentes |
| `page` | `number?` | **qualquer mudança de filtro volta para `page=1`** |

Detalhe do NFT: quantidade escolhida vive em search param (`?qty=`) para persistir no histórico; demais estados são de memória.

## 4. Estrutura padrão de uma feature

```
features/<dominio>/
├── components/     # só usados por esta feature (se virar compartilhado, sobe p/ components/shared)
├── hooks/          # useX — só orquestração; quem chama Axios está em queries.ts
├── queries.ts      # queryOptions + mutations + invalidação (queryClient)
├── search-params.ts# (quando aplicável) schema zod da URL
└── types.ts        # tipos locais derivados dos contratos (z.infer)
```

Regras:

1. `queries.ts` é o único arquivo da feature que importa `lib/http`. Componentes consomem hooks/`useQuery` indiretamente.
2. Query keys sempre passam pela factory de `lib/query/keys.ts` e incluem o `userId` quando o dado é privado.
3. Mutations: sucesso → invalidação explícita via keys; otimismo → `onMutate` cancela queries em voo, faz snapshot, `onError` faz rollback.
4. Erros chegam como `AppError` (union tipada) — a UI decide o texto/estado; nunca vaza `AxiosError` para componente.

## 5. Scripts npm

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | dev server com mocks MSW ativos |
| `pnpm build` / `pnpm preview` | build de produção / preview local |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` / `pnpm lint:fix` | ESLint (+ Prettier) |
| `pnpm test:contract` | Vitest — testes de contrato dos handlers MSW |
| `pnpm test:e2e` | Playwright (headless, Chromium desktop+mobile) |
| `pnpm test:e2e:ui` | Playwright com UI mode |
| `pnpm lighthouse` | auditoria (3 medições/página/perfil, mediana) |
| `pnpm fig:extract` | exporta frames/estilos/imagens do Figma para `docs/figma/` e `public/` |

## 6. Ordem de implementação (para codificação manual)

1. **Fundação** — scaffold Vite+TS+Tailwind+shadcn, tema (`ESTILOS.md`), Header/Footer, árvore de rotas com páginas placeholder, Axios+Query+erros, MSW com `nfts` list/detalhe, extração de assets do Figma.
2. **Catálogo** — busca/filtros/ordenação/paginação na URL, skeletons shimmer, estados vazio/erro.
3. **Detalhes** — galeria, edição, quantidade, NFT inexistente, favoritos (guard de auth).
4. **Conta** — cadastro, login, sessão persistente, guards, logout, troca de usuário (limpa cache).
5. **Carrinho** — CRUD de itens, persistência, cupom, cotação, `nft.updated` em tempo real.
6. **Pagamento + confirmação** — formulário, carteira/rede, revisão, idempotência, `order.updated`, recibo snapshot.
7. **Perfil + carteiras** — incluir variantes mobile (sem frame no Figma).
8. **Tempo real + cenários de falha** — reconexão, reconciliação REST, todos os cenários MSW do enunciado.
9. **Acessibilidade + responsividade** — teclado, foco, zoom, 390/768/1440.
10. **Playwright** — 12 fluxos + regressão visual (início, detalhe, carrinho, pagamento).
11. **Lighthouse + documentação + deploy** — README, ARCHITECTURE.md, Vercel.

## 7. Ambiente e dependências principais

`react`, `react-dom`, `typescript`, `vite`, `@tanstack/react-router`, `@tanstack/react-query`,
`axios`, `tailwindcss` (v4), `shadcn/ui` (+ Radix), `zod`, `decimal.js`, `msw`,
`socket.io-client`, `@mswjs/socket.io-binding`, `@playwright/test`, `lighthouse` (CLI),
`react-hook-form` + `@hookform/resolvers` (formulários longos), `@fontsource/roboto-mono`.

- `.env.example`: `FIGMA_TOKEN` (extração de assets, fora do git), `VITE_MOCKS=true`,
  `VITE_MOCK_SCENARIO` (cenário padrão), `VITE_API_BASE_URL` (aponta para o MSW em dev/demo).
- MCP Figma: corrigir `~/.config/opencode/opencode.json` — o pacote `figma-mcp` exige
  `FIGMA_API_KEY` (hoje está `FIGMA_PERSONAL_ACCESS_TOKEN`) e a sessão precisa reiniciar para reconectar.
