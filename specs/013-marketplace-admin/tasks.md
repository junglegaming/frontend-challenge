---

description: "Task list for 013-marketplace-admin"
---

# Tasks: Administração do marketplace completa

**Input**: Design documents from `/specs/013-marketplace-admin/`

**Prerequisites**: plan.md, spec.md, research.md (D1–D9), data-model.md, contracts/admin-marketplace-endpoints.md, quickstart.md

**Tests**: Incluídos. A constituição (Princípio VII) exige E2E Playwright por página contra os mocks, com falhas e snapshots visuais; SC-002…SC-006 só se provam com testes.

**Organization**: Tarefas agrupadas por história de usuário (spec.md US1–US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1–US3 da spec.md
- Todos os caminhos são relativos à raiz do repositório.

## Path Conventions

Tudo em `apps/web/` mais `docs/TEAMS.md`. `apps/api/`, `server/` e `domains/orders` (site) **não** mudam; o `domains/coins-admin` (012) só é tocado nos testes e1e e nas páginas que passam a usar o novo menu.

---

## Phase 1: Setup

- [X] T001 (2026-10-24: linha de base: 185 testes, typecheck limpo) Confirmar que a branch é `013-admin-marketplace` (empilhada na `012-admin-coins`; os arquivos de `specs/013-marketplace-admin/` estão no disco, sem commit); `pnpm install` na raiz e `pnpm --dir apps/web typecheck` limpo. Guardar a linha de base de `pnpm --dir apps/web exec playwright test --list | tail -1` (esperado: 185 testes, os 144 anteriores mais os 41 da 012)

---

## Phase 2: Foundational (bloqueia as três histórias)

- [X] T002 [P] Em `apps/web/src/domains/admin/model/contracts.ts` acrescentar (Zod/TS, sem `any`; data-model.md): `ORDER_STATUSES = ['pending', 'confirmed', 'declined'] as const`, `ORDER_STATUS_LABELS` (`pending: 'Pendente'`, `confirmed: 'Confirmado'`, `declined: 'Recusado'`), `ADMIN_ORDERS_PAGE_SIZE = 20`; tipos `AdminOverview` (`products.total`, `users.total`, `users.suspended`, `orders.total`, `orders.pending`, `orders.confirmed`, `orders.declined`, todos inteiros **≥ 0**), `AdminOrderSummary` (`id`, `status`, `createdAt` ISO, `buyer: { userId, fullName, email }`, `itemCount` inteiro **≥ 1**, `total` como `EthAmount` string decimal, `network`), `AdminOrdersPage` (`items`, `page`, `pageSize`, `total`, `totalPages`), `AdminOrderDetail` (`Order` de `@/domains/orders` + `userId`), e `adminOrdersSearchSchema = z.object({ status: z.enum(ORDER_STATUSES).optional(), page: z.number().int().min(1).optional() })` (os dois opcionais: o padrão nunca vai para a URL). Exportar tudo pelo `apps/web/src/domains/admin/index.ts`
- [X] T003 [P] Criar `apps/web/src/domains/admin/hooks/use-admin-logout.ts` com `useAdminLogout()`: devolve uma função que chama `useLogout()` de `@/domains/auth` e navega para `/` (`useNavigate`), usada pelo menu das 7 páginas de administração; exportar pelo `index.ts` do domínio
- [X] T004 [P] Em `apps/web/src/mocks/contexts/orders/service.ts` acrescentar três leituras ao `OrderService` (sem alterar as existentes; `get(userId, orderId)` continua exigindo o dono, FR-011): `listAll({ status, page, pageSize })` (pedidos de **todos** os usuários, `createdAt` decrescente com desempate por `id` decrescente, devolve `{ items: AdminOrderSummary[], page, pageSize, total, totalPages }`, onde `total`/`totalPages` respeitam o filtro; página além do fim ⇒ `items` vazio), `getAny(orderId)` (lança `errors.notFound('Pedido')` se não existir; devolve `Order` + `userId`) e `countByStatus()` (`{ total, pending, confirmed, declined }`); as três chamam `settleIfDue` nos pedidos pendentes vencidos **antes** de ler, como `get` já faz. `buyer` vem de `record.userId` e de `record.collector.fullName`/`email`; `itemCount` é a soma de `lines[].quantity`
- [X] T005 [P] Reescrever `apps/web/src/shared/ui/admin-side-menu.tsx` (research D4, D5): `AdminSideMenu({ active, onLogout })` com `active: 'overview' | 'products' | 'users' | 'orders' | 'coins'` e os itens, nesta ordem, "Visão geral" → `/admin`, "Produtos" → `/admin/products`, "Usuários" → `/admin/users`, "Pedidos" → `/admin/orders`, "Moedas" → `/admin/coins`, e, depois de um separador (`separated`), o botão "**Sair do site**" que chama `onLogout`; ícones já existentes em `@/shared/icons`. Não importar nada de `domains/`
- [X] T006 Passar `onLogout={useAdminLogout()}` ao `AdminSideMenu` nas quatro páginas que já o usam: `apps/web/src/pages/admin-products/AdminProductsPage.tsx`, `apps/web/src/pages/admin-users/AdminUsersPage.tsx`, `apps/web/src/pages/admin-coins/AdminCoinsPage.tsx` e `apps/web/src/pages/admin-coins-owner/AdminCoinsOwnerPage.tsx` (importando de `@/domains/admin`). Depende de T003, T005
- [X] T007 (2026-10-24: só o teste do detalhe precisou da lista de botões ampliada (a lista usa o escopo da seção, que não inclui o menu)) Ajustar os testes da 012 ao novo menu (o nome acessível casa por substring: "Sair do site" contém "Sair"): em `apps/web/e2e/admin-coins-login/admin-coins-login.spec.ts` (linhas dos três `getByRole('button', { name: 'Sair' })`) e em `apps/web/e2e/admin-coins-owner/admin-coins-owner.spec.ts` (o `Sair` do detalhe) usar `{ name: 'Sair', exact: true }`; nas listas de botões permitidos de `apps/web/e2e/admin-coins/admin-coins.spec.ts` ("a área não oferece ação que altere dados") e de `apps/web/e2e/admin-coins-owner/admin-coins-owner.spec.ts` acrescentar `'Sair do site'`. Não mudar mais nada desses testes. Depende de T005
- [X] T008 (2026-10-24: helpers `createOrderViaApi(page, edição?)` e `pickAvailableEditions`) [P] Estender os helpers de e2e em `apps/web/e2e/design-system/helpers.ts` (sem mudar o comportamento atual): `createOrderViaApi(page, edition?: { nftId: string; editionId: string })` (padrão atual: `nft_001`/`nft_001_standard`) e `pickAvailableEditions(page, count)`, que lê o catálogo público (`GET /api/nfts?availability=available&pageSize=48`, campo `items`) e, para cada NFT, `GET /api/nfts/:nftId` para as edições, e devolve `count` pares `{ nftId, editionId }` **distintos** com `status === 'available'` e `available ≥ 1`, lançando um erro claro se não houver o bastante. Motivo: a edição padrão de `nft_001` tem de 1 a 25 unidades (suprimento 25 menos um valor sorteado), pedidos pendentes reservam estoque e confirmados o consomem, então comprar sempre a mesma edição falha. Usada pelas T010, T016 e T017
- [X] T009 (2026-10-24: 61 testes verdes; o `maxDiffPixelRatio: 0.02` do projeto esconde a mudança do menu e o `--update-snapshots` padrão não regrava o que não falha, então as 6 imagens da 012 foram regravadas com `--update-snapshots=all` e conferidas) Rodar `pnpm --dir apps/web typecheck`, `pnpm --dir apps/web lint` e `pnpm --dir apps/web exec playwright test e2e/admin-products e2e/admin-users e2e/admin-coins-login e2e/admin-coins/ e2e/admin-coins-owner`: tudo verde (as páginas de produtos e usuários não têm teste visual; as imagens da 012 em `apps/web/e2e/admin-coins/` e `apps/web/e2e/admin-coins-owner/` mostram o menu e **vão mudar** por ele: revisar cada imagem e atualizar a baseline com `--update-snapshots`, e repetir sem a flag). Depende de T006, T007

**Checkpoint**: o menu novo funciona nas quatro páginas existentes e nada da 012 quebrou.

---

## Phase 3: User Story 1 — Chegar à administração e ver o panorama (Priority: P1) 🎯 MVP

**Goal**: o administrador acha o link, abre o painel, vê os totais e usa os atalhos; ninguém mais vê o link.

**Independent Test**: como admin, achar "Administração" na navegação e no menu da conta, abrir o painel e conferir os números; como colecionador e como visitante, o link não existe e `/admin` é recusado.

### Tests for User Story 1

- [X] T010 (2026-10-24: e2e/admin-dashboard (13 testes)) [P] [US1] Criar `apps/web/e2e/admin-dashboard/admin-dashboard.spec.ts` (helpers de `apps/web/e2e/design-system/helpers.ts`: `signIn`, `promoteCurrentUserToAdmin`, `createOrderViaApi`, `settleAllOrders`, `selectScenario`, `runAxe`, `hasNoHorizontalScroll`, `VIEWPORTS`): (a) admin logado vê o link "Administração" na navegação (`banner`) e no menu da conta (`/account/profile`), e clicar leva a `/admin`; (a2) **no celular** (390 px, `test.use({ viewport: VIEWPORTS.mobile })`) a navegação larga não existe: o item "Administração" aparece na `Dock` (barra inferior) e leva ao painel, e de qualquer página o admin chega a uma área (por exemplo Produtos) em **no máximo 2 cliques** (SC-001); (b) colecionador (`signIn` sem promover) não tem o link em nenhum dos dois lugares **nem por um instante**: registrar, com `page.addInitScript`, um `MutationObserver` que anota se algum nó com o texto "Administração" aparece durante o carregamento, e afirmar que nada foi anotado; visitante também não; (c) colecionador abrindo `/admin` volta a `/` com o aviso de acesso negado (como em `e2e/admin-products/access-control.spec.ts`); visitante vai a `/login?redirect=…` e, depois de entrar como admin, volta a `/admin`; (d) estado novo: o painel mostra zeros para pedidos (não erro); (e) com 2 pedidos criados (`createOrderViaApi(page, edição)` com edições de `pickAvailableEditions`, T009 novo) e depois liquidados, o painel mostra "2" pendentes e depois "2" confirmados; usuários e suspensos conferem com `GET /api/admin/users` (suspender um usuário via `POST /api/admin/users/:id/suspend` e ver "suspensos" subir); produtos confere com a contagem de `GET /api/admin/nfts` publicada; (f) os atalhos Produtos, Usuários e Moedas existem no painel e levam às áreas certas (o atalho **Pedidos** nasce na US2, com a rota, e é testado na T016(j)); (g) "Sair do site" no menu leva a `/` e `/admin` volta a exigir login; (h) `coins-unavailable` não afeta o painel, mas uma falha do serviço simulado de admin mostra "Não foi possível carregar o painel." com "Tentar de novo" (usar o cenário de falha de requisições existente em `apps/web/src/mocks/scenarios/definitions.ts`); (i) axe sem violações críticas e visual nos 3 tamanhos (`admin-dashboard-390/768/1440.png`, relógio congelado e UTC)

### Implementation for User Story 1

- [X] T011 (2026-10-24: overview no mock) [P] [US1] Em `apps/web/src/mocks/contexts/admin/service.ts` acrescentar `AdminService.overview()` (`products.total` = NFTs publicados, isto é, fora de `delistedNftIds`; `users.total` e `users.suspended`) e, em `apps/web/src/mocks/contexts/admin/handlers.ts`, o handler `GET ${api}/admin/overview` (usa `requireAdmin` e junta `orders.countByStatus()` da T004; responde `{ products, users, orders }` do data-model). Mudar a assinatura para `adminHandlers(api, admin, auth, orders)` e atualizar `apps/web/src/mocks/composition.ts`. Depende de T004
- [X] T012 (2026-10-24: useAdminOverview) [US1] Em `apps/web/src/domains/admin/api/queries.ts` acrescentar `useAdminOverview()` (`api.get<AdminOverview>('/admin/overview')`, chave `['admin', 'overview']`, `retry` só para falhas transitórias como as demais queries do domínio); exportar. Depende de T002
- [X] T013 (2026-10-24: nav-items requiresRole, Navbar/Dock/menu da conta por papel; Dock compacta com 6 itens) [US1] Mostrar o link "Administração" só para administradores, na navegação larga **e na `Dock` do celular** (FR-004, SC-001, research D3): em `apps/web/src/app/layout/nav-items.ts` acrescentar o campo opcional `requiresRole?: 'admin'` a `NavItem`, ampliar a união de `to` com `'/admin'` e acrescentar o item `{ id: 'admin', label: 'Administração', icon: <ícone existente de @/shared/icons>, to: '/admin', enabled: true, placement: ['navbar', 'dock'], requiresRole: 'admin' }`; em `apps/web/src/app/layout/Navbar.tsx` e `apps/web/src/app/layout/Dock.tsx` mostrar os itens com `requiresRole` apenas quando `user?.role === requiresRole` (papel desconhecido = oculto) e conferir que a `Dock` com 6 itens não gera rolagem horizontal em 390 px; em `apps/web/src/shared/ui/account-side-menu.tsx` aceitar `showAdmin?: boolean` e, quando verdadeiro, mostrar o item "Administração" (`href="/admin"`, ícone existente) logo depois de "Carteiras"; em `apps/web/src/pages/profile/ProfilePage.tsx` e `apps/web/src/pages/wallets/WalletsPage.tsx`, **que hoje não usam `useSession`**, importar `useSession` de `@/domains/auth` e passar `showAdmin={session.data?.user.role === 'admin'}` (papel desconhecido = falso). Depende de T014 (a rota `/admin` precisa existir no mapa de rotas, senão `to: '/admin'` não compila)
- [X] T014 (2026-10-24: página e rota /admin) [US1] Criar a página `apps/web/src/pages/admin-dashboard/AdminDashboardPage.tsx`, `index.ts` e `README.md` (escopo, rota `/admin`, domínio `admin`) e a rota `apps/web/src/app/routes/admin.index.tsx` (`createFileRoute('/admin/')` com `beforeLoad: ({ location, context }) => requireRole(location.href, context, 'admin')`): `AdminSideMenu active="overview"` + `onLogout`, título "Administração", cartões de totais (Produtos, Usuários com "N suspensos", Pedidos com pendentes/confirmados/recusados) em `aria-live="polite"`, atalhos (`Link`) para Produtos, Usuários e Moedas (o atalho Pedidos é acrescentado na T021, quando a rota `/admin/orders` existe: um `Link` tipado para rota inexistente não compila), skeleton ao carregar, erro "Não foi possível carregar o painel." com "Tentar de novo". Regenerar `apps/web/src/app/routeTree.gen.ts` rodando `node ./node_modules/vite/bin/vite.js build` dentro de `apps/web` (o `pnpm build` roda o `tsc` antes e falha enquanto a rota não existe) e conferir que o diff só acrescenta a rota. Depende de T005, T012
- [X] T015 (2026-10-24: 26/26 em 2 repetições, baselines 390/768/1440 revisadas) [US1] Rodar `pnpm --dir apps/web typecheck && pnpm --dir apps/web lint` e `pnpm --dir apps/web exec playwright test e2e/admin-dashboard`; criar as baselines visuais (`--update-snapshots`), **revisar as imagens** e repetir duas vezes sem a flag: tudo verde. Depende de T010–T014

**Checkpoint**: US1 funciona; o admin chega e vê o panorama.

---

## Phase 4: User Story 2 — Acompanhar os pedidos de todos os usuários (Priority: P2)

**Goal**: lista paginada com filtro por estado e detalhe somente leitura, idêntico ao recibo do comprador.

**Independent Test**: com pedidos de vários usuários em estados diferentes, percorrer todas as páginas sem repetir, filtrar por estado, abrir um pedido e comparar com o recibo.

### Tests for User Story 2

- [X] T016 (2026-10-24: e2e/admin-orders (15 testes, cenário payment-slow novo)) [P] [US2] Criar `apps/web/e2e/admin-orders/admin-orders.spec.ts` (semear com contas diferentes: `signIn` de novo cria outra conta e troca a sessão; `pickAvailableEditions(page, 25)` (T009 novo) escolhe 25 edições distintas com estoque e `createOrderViaApi(page, edição)` cria **um pedido por edição** da conta atual (a edição padrão de `nft_001` tem de 1 a 25 unidades, então não dá para comprar sempre a mesma); `settleAllOrders` confirma os pendentes; `selectScenario(page, 'payment-declined')` antes de criar produz pedidos recusados; terminar com `promoteCurrentUserToAdmin`; 25 pedidos no total, 10 confirmados, 10 pendentes, 5 recusados): (a) a lista abre com 20 pedidos, do mais recente para o mais antigo, cada linha com comprador, itens, total, estado e data; (b) percorrer as páginas (20 e 5): cada pedido aparece **uma vez** e a união é igual ao conjunto semeado (SC-003); (c) filtrar por "Confirmado", "Pendente" e "Recusado": só aquele estado e a contagem bate com o semeado, e a URL traz `?status=` (sem filtro, sem parâmetro); (d) a página está na URL (`?page=2`): abrir o endereço direto mostra a mesma página; trocar o filtro volta à página 1; (e) `?page=abc` e `?status=xyz` são ignorados (primeira página, todos os estados); (f) estado vazio com filtro sem resultados ("Nenhum pedido encontrado.") e num estado novo sem pedidos; (g) colecionador e visitante são recusados como em `access-control.spec.ts`; (h) nenhuma ação que altere pedido (SC-006: sem botões além de filtro, paginação, Sair do site e links); (i) falha do serviço simulado mostra "Não foi possível carregar os pedidos." com "Tentar de novo" que funciona depois; (j) o painel `/admin` tem o atalho **Pedidos** e ele leva à lista (FR-003; completa o que a T010(f) deixou); (k) axe e visual nos 3 tamanhos (`admin-orders-390/768/1440.png`, relógio congelado, UTC, mesmos dados); (l) **comprador suspenso**: suspender (`POST /api/admin/users/:id/suspend`) o usuário que fez um dos pedidos e ver o pedido ainda na lista, com o comprador registrado nele
- [X] T017 (2026-10-24: e2e/admin-order (7 testes + visuais)) [P] [US2] Criar `apps/web/e2e/admin-order/admin-order.spec.ts` (pedidos criados com `createOrderViaApi(page, edição)` e `pickAvailableEditions`, T009 novo, porque a edição padrão não aguenta muitos pedidos): (a) o detalhe de um pedido confirmado mostra comprador, estado, itens (nome, edição, quantidade, valores), carteira e rede, cupom (quando houver), subtotal, desconto, taxa, total e a transação; os **valores e itens são idênticos aos do recibo** que o dono vê em `/orders/<id>` (ler os textos dos dois e comparar; SC-004); (b) pedido recusado mostra o motivo; pedido pendente mostra o estado "Pendente"; (c) `/admin/orders/inexistente` e um identificador malformado (`%20`, 200 caracteres) mostram "Pedido não encontrado." com "Voltar para a lista"; (d) colecionador e visitante recusados; o dono continua vendo só o próprio pedido: com a conta de outro colecionador, `GET /api/orders/<id>` do primeiro responde `403`; (e) nenhuma ação que altere o pedido; (f) axe e visual nos 3 tamanhos (`admin-order-390/768/1440.png`)

### Implementation for User Story 2

- [X] T018 (2026-10-24: handlers /admin/orders*) [US2] Em `apps/web/src/mocks/contexts/admin/handlers.ts` acrescentar `GET ${api}/admin/orders` (parâmetros `status` ∈ `pending`/`confirmed`/`declined`, `page` inteiro **≥ 1** (padrão 1), `pageSize` inteiro de **1 a 20** (padrão 20), senão `400 VALIDATION`; responde `orders.listAll(...)`) e `GET ${api}/admin/orders/:orderId` (responde `orders.getAny(orderId)`; inexistente ou malformado ⇒ `404 NOT_FOUND` "Pedido não encontrado."), ambos com `requireAdmin` e **somente leitura** (nenhuma rota de escrita). Depende de T004, T011
- [X] T019 (2026-10-24: useAdminOrders/useAdminOrder) [US2] Em `apps/web/src/domains/admin/api/queries.ts` acrescentar `useAdminOrders({ status, page })` (chave `['admin', 'orders', status ?? 'all', page ?? 1]`, `placeholderData: keepPreviousData`, `retry` só transitório) e `useAdminOrder(orderId)` (chave `['admin', 'orders', 'detail', orderId]`); exportar. Depende de T002
- [X] T020 (2026-10-24: OrderStatusBadge (Recusado em contorno por contraste)) [P] [US2] Criar `apps/web/src/domains/admin/components/OrderStatusBadge.tsx` (selo com `ORDER_STATUS_LABELS`, cor e texto, nunca só cor) e exportá-lo pelo `index.ts` do domínio (usado pela lista e pelo detalhe, que são páginas diferentes)
- [X] T021 (2026-10-24: página admin-orders + rota + atalho no painel) [US2] Criar a página `apps/web/src/pages/admin-orders/AdminOrdersPage.tsx`, `components/OrdersTable.tsx`, `components/OrdersFilter.tsx`, `index.ts` e `README.md` e a rota `apps/web/src/app/routes/admin.orders.index.tsx` (`beforeLoad` com `requireRole(..., 'admin')`; `validateSearch: adminOrdersSearchSchema.catch({ status: undefined, page: undefined })`: **nomeando as chaves**, porque o roteador junta a busca validada com a bruta; navegar escrevendo `undefined` para `page === 1` e para "todos", de modo que a primeira página fica em `/admin/orders`): tabela com `caption`, cabeçalhos `scope="col"` (Pedido, Comprador, Itens, Total, Estado, Data), cada pedido é link (`Link to="/admin/orders/$orderId"`) para o detalhe, filtro por estado (select rotulado, com "Todos"), paginação "Anterior"/"Próxima" com "Página N de M", estados de carregamento/vazio/erro. **Acrescentar também** o atalho "Pedidos" (`Link to="/admin/orders"`) em `apps/web/src/pages/admin-dashboard/AdminDashboardPage.tsx`. Depende de T014, T019, T020
- [X] T022 (2026-10-24: página admin-order + rota) [US2] Criar a página `apps/web/src/pages/admin-order/AdminOrderPage.tsx`, `index.ts` e `README.md` e a rota `apps/web/src/app/routes/admin.orders.$orderId.tsx` (`beforeLoad` com `requireRole(..., 'admin')`): detalhe somente leitura (comprador com nome, e-mail e id de usuário; `OrderStatusBadge`; itens; carteira e rede; cupom; valores formatados com os **mesmos** formatadores de ETH do recibo, `apps/web/src/shared/lib/eth.ts`; transação com link ao explorador; motivo da recusa), `404` ⇒ "Pedido não encontrado." + `Link` "Voltar para a lista", erro ⇒ "Tentar de novo". Regenerar `routeTree.gen.ts` como na T014. Depende de T019, T020
- [X] T023 (2026-10-24: 50/50 em 2 repetições, baselines revisadas) [US2] Rodar `typecheck`, `lint` e `pnpm --dir apps/web exec playwright test e2e/admin-orders/ e2e/admin-order/`; baselines criadas e **revisadas**, estáveis em duas execuções sem a flag. Depende de T016–T022

**Checkpoint**: US2 funciona; US1 continua verde.

---

## Phase 5: User Story 3 — Navegar pelos menus sem recarregar a página (Priority: P3)

**Goal**: trocar de item nos menus laterais não recarrega a página nem derruba o que está em memória.

**Independent Test**: marcar `window`, clicar nos itens dos menus e ver a marca sobreviver; entrar no admin das moedas, ir a Produtos e voltar a Moedas pelo menu sem perder o acesso.

### Tests for User Story 3

- [X] T024 (2026-10-24: e2e/side-menu (7 testes)) [P] [US3] Criar `apps/web/e2e/side-menu/side-menu.spec.ts`: (a) **sem recarregar**: com `page.evaluate(() => { window.__marker = 1 })` antes, clicar em "Carteiras" (menu da conta) e depois em "Dados do perfil", e em "Visão geral", "Produtos", "Usuários" e "Pedidos" (menu do admin, como administrador): a URL muda e `window.__marker` continua `1` em todos os cliques (SC-005); (b) **acesso das moedas sobrevive**: promover o usuário do site a admin, ir a `/admin/coins/login`, entrar com a credencial do mock (`apps/web/e2e/admin-coins/helpers.ts`), clicar em "Produtos" (menu) e depois em "Moedas": a lista abre **sem** pedir login; (c) clique com Ctrl/Cmd abre uma nova aba (`context.waitForEvent('page')`) e a página original continua na mesma URL; (d) pelo teclado: focar um item e apertar Enter navega, e o item da página atual tem `aria-current="page"`; (e) itens desativados do menu da conta ("Atividade", "Ofertas", …) continuam inertes (clicar não muda a URL) e anunciam "(indisponível)"; (f) o botão "Sair" do menu da conta e o "Sair do site" do menu do admin continuam funcionando (sessão encerrada, vão ao início)

### Implementation for User Story 3

- [X] T025 (2026-10-24: SideMenuItem navega pelo roteador; item ativo da faixa visível (reveal após fontes)) [US3] Em `apps/web/src/shared/ui/side-menu.tsx` (research D2) manter `<a href>` em `SideMenuItem` e interceptar **só** o clique simples: `onClick` que, se `event.defaultPrevented`, `event.button !== 0`, `metaKey`, `ctrlKey`, `shiftKey`, `altKey` ou `target` presente, não faz nada; senão `event.preventDefault()` e `router.history.push(href)`, com `useRouter()` de `@tanstack/react-router` (o `shared/` não importa `app/`). Respeitar um `onClick` recebido (chamá-lo antes). Itens `disabled` e itens-botão (sem `href`) ficam exatamente como estão. Depende de nada além de T001
- [X] T026 (2026-10-24: 154 verdes nas pastas dos menus, sem baseline alterada; e2e/wallets/coins 'retrying after a lost response' é instável no HEAD (confirmado em worktree limpo), fora do escopo) [US3] Rodar `typecheck`, `lint`, `pnpm --dir apps/web exec playwright test e2e/side-menu` e as pastas que usam os menus (`e2e/wallets`, `e2e/auth`, `e2e/admin-products`, `e2e/admin-users`, `e2e/admin-coins-login`, `e2e/admin-coins/`, `e2e/admin-coins-owner`, `e2e/admin-dashboard`): tudo verde e **nenhuma baseline visual das páginas de conta mudou** (o menu deve ficar igual por fora). Depende de T024, T025

**Checkpoint**: as três histórias funcionam.

---

## Phase 6: Polish & Cross-Cutting

- [X] T027 (2026-10-24: TEAMS.md (3 páginas, domínio admin, menus/nav por papel) + domains/admin/README.md) [P] Atualizar `docs/TEAMS.md`: as três páginas novas (`pages/admin-dashboard` → `/admin`, `pages/admin-orders` → `/admin/orders`, `pages/admin-order` → `/admin/orders/$orderId`, domínio `admin`) na tabela de Páginas, a descrição do domínio `admin` (visão geral e pedidos do admin, somente leitura) e uma nota sobre `shared/ui/side-menu.tsx` navegar pelo roteador; escrever `apps/web/src/domains/admin/README.md` (ou atualizar se existir) com o contexto, as leituras novas, `useAdminLogout`, os códigos `401`/`403`/`404` e que o menu usa "Sair do site"
- [X] T028 (2026-10-24: teste de produção do visitante em /admin e /admin/orders) Em `apps/web/e2e/production/hardening.spec.ts` acrescentar um teste: no build de produção um visitante abrindo `/admin` e `/admin/orders` é levado a `/login?redirect=…`, e nenhuma requisição vai a `localhost`/porta 4000 (`/api/admin/*` continua sendo do mock, `/backend/*` do serviço real)
- [X] T029 (2026-10-24: typecheck/lint/build/bundle limpos; suíte completa 229 verdes + 1 instável preexistente (wallets/coins 'retrying after a lost response', falha também no HEAD); produção 10/10; nada mudou em apps/api, server, domains/orders, domains/coins-admin) Gate de regressão a partir da raiz: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `node apps/web/scripts/check-production-bundle.mjs`, `pnpm --dir apps/web exec playwright test` (suíte completa: a linha de base de T001 mais os testes novos, **0 falhas**) e `-c playwright.production.config.ts`; `git status` sem mudanças em `apps/api/`, `server/`, `apps/web/src/domains/orders` nem `apps/web/src/domains/coins-admin`
- [ ] T030 **Precisa de confirmação do usuário — publica o site.** Depois do merge, `pnpm exec vercel deploy --prod` em `apps/web`; entrar como `ana@nft.dev` no site publicado, achar "Administração", abrir o painel, os pedidos e um detalhe, e navegar pelo menu até "Moedas" sem perder o acesso. Somente leitura

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T009)** → US1 → US2 → US3 → Polish. US3 só depende de T001 e pode ser feita antes das outras se for conveniente.
- Dentro de Foundational: T002, T003, T004 e T005 são independentes entre si; T006 depende de T003 e T005; T007 de T005; T009 de T006 e T007.

### User Story Dependencies

- **US1** precisa de Foundational (menu novo, hook de sair, contratos, leituras do mock).
- **US2** precisa de Foundational e reaproveita o handler de `adminHandlers` da T011 (nova assinatura com `orders`).
- **US3** é independente das outras duas na lógica; seu teste usa o menu novo (T005) e a rota `/admin` (T014) para provar a navegação, então roda depois da US1.

### Within Each Story

- E2E primeiro (T010, T016/T017, T024), vê-los falhar, depois mock → queries → UI → baselines.

### Parallel Opportunities

- Foundational: T002 ∥ T003 ∥ T004 ∥ T005 ∥ T008.
- US1: T010 ∥ T011 ∥ T013. US2: T016 ∥ T017 ∥ T020. US3: T024 ∥ T025.
- Polish: T027 ∥ T028.

## Parallel Example: Foundational

```text
Task: "T002 contratos em apps/web/src/domains/admin/model/contracts.ts"
Task: "T003 useAdminLogout em apps/web/src/domains/admin/hooks/use-admin-logout.ts"
Task: "T004 leituras do OrderService em apps/web/src/mocks/contexts/orders/service.ts"
Task: "T005 AdminSideMenu em apps/web/src/shared/ui/admin-side-menu.tsx"
```

## Implementation Strategy

### MVP First (US1)

T001–T015: o administrador acha o link, vê o painel e usa os atalhos, e o menu do admin já tem "Pedidos" e "Sair do site". A lista de pedidos (US2) é o próximo incremento e traz junto o atalho "Pedidos" do painel; até lá o MVP entrega o painel com os totais e os atalhos Produtos, Usuários e Moedas.

### Incremental Delivery

1. US1 → porta de entrada e painel. 2. US2 → pedidos (lista e detalhe). 3. US3 → menus sem recarregar. 4. Polish (T027–T030).

## Notes

- `apps/api` e `server/` NÃO mudam, e o isolamento do colecionador também não: `GET /api/orders/:id` continua exigindo o dono. Se uma tarefa parecer exigir mudar isso, parar.
- Nada de ação que altere pedidos (cancelar, reembolsar): é outra feature.
- Ações externas só com confirmação imediata do usuário: T030 (publicação).
