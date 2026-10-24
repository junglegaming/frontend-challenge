# Organização do código

O repositório é um workspace **pnpm + Nx** (`pnpm-workspace.yaml`, `nx.json`):

```
apps/web/     SPA React (o frontend descrito abaixo) — todos os caminhos `src/...` deste documento
              são relativos a apps/web/
apps/api/     backend real em Express na Vercel, com Vercel Blob e auth por JWT
              (specs/007-monorepo-vercel-blob, README próprio)
server/       backend real de moedas da 006 (Express + SQLite), fora do workspace, intocado
```

Comandos na raiz: `pnpm dev` (web), `pnpm dev:api`, `pnpm dev:all` (web + api + server),
`pnpm build` / `pnpm typecheck` / `pnpm lint` (todos os projetos via Nx), `pnpm test:e2e` (web).
Para um projeto só: `nx run web:<alvo>` ou `nx run api:<alvo>`.

Dentro de `apps/web`, o projeto separa **páginas** (o que o usuário vê, uma pasta por tela) de
**domínios** (regras de negócio compartilhadas entre telas). Cada time é dono de uma ou mais páginas e
consome os domínios pela API pública.

```
src/
  app/        router, providers, layout raiz e rotas finas (src/app/routes)
  pages/      UMA PASTA POR PÁGINA do e-commerce
  domains/    regras de negócio (DDD): contratos, API, cache, eventos
  shared/     design system (shadcn/ui), Axios, Socket.IO, utilitários
  mocks/      MSW: banco simulado, fixtures, handlers, cenários, socket
e2e/          Playwright, uma pasta por página
```

## Páginas

| Pasta | Página | Rota | Domínios usados |
| --- | --- | --- | --- |
| `pages/home` | Início | `/` | catalog, favorites, cart |
| `pages/nft-detail` | Detalhes do NFT | `/nft/$nftId` | catalog, favorites, cart |
| `pages/cart` | Carrinho | `/cart` | cart, catalog |
| `pages/checkout` | Pagamento | `/checkout` | cart, wallets, orders, checkout, auth |
| `pages/order-confirmation` | Confirmação de pedido | `/orders/$orderId` | orders |
| `pages/login` | Login | `/login` | auth, cart |
| `pages/signup` | Cadastro | `/signup` | auth, cart |
| `pages/profile` | Perfil do colecionador | `/account/profile` | profile, auth |
| `pages/wallets` | Carteiras | `/account/wallets` | wallets, ledger |
| `pages/admin-dashboard` | Visão geral (totais e atalhos do admin) | `/admin` | admin |
| `pages/admin-orders` | Pedidos de todos os usuários (lista, filtro, paginação) | `/admin/orders` | admin |
| `pages/admin-order` | Detalhe de um pedido (somente leitura) | `/admin/orders/$orderId` | admin |
| `pages/admin-coins-login` | Entrada do admin das moedas | `/admin/coins/login` | coins-admin |
| `pages/admin-coins` | Moedas (donos de saldo) | `/admin/coins` | coins-admin |
| `pages/admin-coins-owner` | Dono de saldo (saldo e extrato) | `/admin/coins/$ownerId` | coins-admin |
| `pages/not-found` | 404 | qualquer rota inexistente | — |

Anatomia de uma página:

```
src/pages/<página>/
  <Página>Page.tsx   componente da página
  components/        componentes exclusivos desta página
  index.ts           exporta a página para a rota
  README.md          escopo, rota e domínios usados
```

## Domínios

| Domínio | Responsabilidade |
| --- | --- |
| `catalog` | NFTs, edições, busca/filtros, `nft.updated` |
| `favorites` | Favoritos por usuário (otimista + rollback) |
| `cart` | Carrinho, cupom, cotação, merge do visitante |
| `checkout` | Dados do colecionador, rede, idempotência |
| `orders` | Pedidos, `order.updated`, recibo |
| `auth` | Sessão, cadastro, login, expiração |
| `profile` | Perfil, avatar, senha |
| `wallets` | Carteiras e conexão simulada |
| `admin` | Admin do marketplace (simulado, MSW): visão geral, pedidos de todos os usuários e produtos/usuários; leituras de pedido somente leitura |
| `coins-admin` | Admin real das moedas (`apps/api`): sessão só em memória, lista de donos, saldo e extrato; somente leitura |

```
src/domains/<domínio>/
  model/       contratos (DTOs) e regras puras, sem React e sem Axios
  api/         funções Axios + queryOptions/queryKeys
  hooks/       queries, mutations e eventos de tempo real
  components/  componentes reutilizados por mais de uma página
  index.ts     API pública
```

## Regras de dependência (verificadas por `pnpm lint`)

```
app/routes  →  pages  →  domains  →  shared
```

1. Uma página **não importa outra página**. Componentes usados por duas páginas sobem para um domínio ou para `shared/ui`.
2. Páginas e rotas importam domínios apenas por `@/domains/<domínio>` (o `index.ts`), nunca por caminhos internos.
3. Rotas importam páginas apenas por `@/pages/<página>`.
4. Dentro da própria página ou domínio, use imports relativos (`./components/...`, `../model/...`).
5. `shared/` não importa `app/`, `pages/` nem `domains/`.
6. **Proibido `any`**: use `unknown` + narrowing, genéricos ou tipos dos contratos.
7. Componentes, hooks e o cliente Axios **não** contêm dados fictícios: toda simulação fica em `src/mocks`.
8. `src/shared/ui/*` são componentes do shadcn/ui (gerados pela CLI oficial, `pnpm dlx shadcn@latest add <componente>`).
   Eles são adaptados ao tema do projeto via `src/index.css`, não reescritos; `react/only-export-components`
   fica desligado só nessa pasta porque é o padrão do shadcn exportar `xxxVariants` junto do componente.
9. Ícones vêm só de `@/shared/icons` (único módulo que importa `lucide-react`; verificado por `pnpm lint`).

## Padrões visuais

Fonte de verdade: `specs/001-design-system-standards` (`contracts/design-tokens.md` e `contracts/ui-components.md`).

- **Tokens**: cores, tipografia, raios e alturas vivem no bloco de tokens de `src/index.css`. Páginas e componentes usam
  tokens por nome (`bg-card`, `text-muted-foreground`, `text-body`...); nunca valores literais (`pnpm check:tokens`).
- **Paleta base**: `#140D0A` fundo · `#241612` superfície · `#D28A4C` primária · `#B39463` texto secundário ·
  `#F5F1EB` texto principal · `#CFB28C` foco.
- **Fonte**: Space Mono em toda a interface. Escala: `title` 16/700, `body` 14/400, `action` 14/700, `caption` 12/400.
- **Layout**: toda página usa `PageContainer` (`@/shared/ui/page-container`, máx. 1200 px, gutter 16/24 px).
- **Navegação**: `Navbar` (`app/layout/Navbar.tsx`) e `Dock` (`app/layout/Dock.tsx`, só abaixo de 768 px) leem os mesmos
  itens de `app/layout/nav-items.ts`. Destino sem rota fica desabilitado, nunca como link. Um item com `requiresRole`
  (hoje "Administração", só para `role === 'admin'`) só aparece para esse papel; papel desconhecido nunca vê o item.
- **Menus laterais**: `shared/ui/side-menu.tsx` (conta e admin) navega pelo **roteador** num clique simples: um `<a href>`
  recarregaria a página e derrubaria o que só vive em memória (a sessão do admin das moedas). Ctrl/Cmd, botão do meio e
  `target` seguem o comportamento normal do navegador. Na faixa rolável do celular o item atual é trazido para a vista.
- **Componentes**: reutilize os de `src/shared/ui` (`Button`, `Input`, `Field`, `Label`, `Select`, `PasswordInput`,
  `SideMenu`, `NavLink`, `CountBadge`, `Avatar`, `Skeleton`...). Se uma página precisa de um componente igual a outra,
  ele sobe para `shared/ui`.
- **Catálogo**: `/design-system` (dev e build de demonstração) mostra tokens, ícones e componentes com seus estados.
- **Regra de revisão**: cor, fonte, espaçamento ou componente fora do catálogo exige justificativa no PR; se aprovado,
  atualize o contrato e o catálogo.

## Ambiente de produção

- O `apps/web` é publicado como projeto Vercel próprio (`nft-marketplace-web`). Produção é uma **demonstração
  com mocks**: o MSW atende `/api/*` (Princípio V); só `/backend/*` chega à API real (`apps/api`) por rewrite.
- Moedas da Kurio ficam **ativas em produção** (specs/011-web-coins-real-api): o domínio `ledger` fala com o `apps/api`
  real por `/backend`. O antigo `domains/coins` (cliente do `server/`) foi removido. Limitação: a emissão do token de
  moedas confia no id da sessão simulada, então as moedas publicadas são de demonstração.
- Variáveis: `apps/web/.env.production` (valores públicos) e a matriz em
  `specs/008-web-production-env/data-model.md`. Ambientes por projeto: `specs/008-web-production-env/deploy-environments.md`.
- Publicar e validar: `specs/008-web-production-env/quickstart.md`.

## Ambiente de produção (`apps/web`)

O site publicado é um **demo com mocks**: o MSW atende `/api/*` (catálogo, auth, carrinho, pedidos), porque o
produto não tem back-end real para isso (constituição, Princípio V). O único tráfego real é o do domínio
`ledger`, que chega a `apps/api` por `/backend/*` (rewrite em `apps/web/vercel.json`). Detalhes, contrato de
entrega e procedimento: `specs/008-web-production-env/`.

Variáveis `VITE_*` são embutidas no build; mudar uma exige novo deploy. Preview e produção usam o mesmo conjunto.

| Variável | Dev / e2e | Preview = Produção |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | `true` |
| `VITE_ENABLE_BACKEND_MOCKS` | `true` (padrão em dev) | **`false`** (padrão em build de produção) |
| `VITE_BACKEND_BASE_URL` | `/backend` | `/backend` |

Consequências para quem mexe no código: as moedas (`domains/ledger`) aparecem em todos os ambientes e o mock do
`/backend` não é registrado em produção (lá o `/backend` chega ao `apps/api` real); `src/shared/config/zod.ts` precisa ser o primeiro import de `main.tsx`
(CSP sem `unsafe-eval`). Testes do build de produção: `pnpm --dir apps/web test:e2e:production`; ausência de
`localhost:<porta>` no bundle: `pnpm --dir apps/web check:production-bundle`.
