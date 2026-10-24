---

description: "Task list template for feature implementation"
---

# Tasks: Telas do Marketplace de NFTs (Mobile + Desktop)

**Input**: Design documents from `/specs/002-nft-marketplace-screens/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Included. The project constitution (Princípio VII, NON-NEGOTIABLE for responsiveness/a11y
and mandatory for critical flows) requires Playwright E2E coverage per page — including failure
scenarios and visual regression at 390/768/1440 px — so test tasks are generated per user story,
following the existing convention in `e2e/design-system/` (`VIEWPORTS`, `signIn`, `hasNoHorizontalScroll`,
`runAxe`).

**Organization**: Tasks are grouped by user story (from `spec.md`) to enable independent
implementation and testing of each story. Every route/domain/page referenced below already has a
skeleton folder (`src/pages/*`, `src/domains/*`) — tasks fill them in, they do not create new
top-level folders.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps the task to US1–US6 from `spec.md`
- File paths are exact and relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the shadcn/ui primitives this feature needs before any story starts building
UI with them (avoids duplicate/conflicting installs across parallel story work).

- [X] T001 [P] Install `sheet`, `slider`, `radio-group`, `textarea` and `checkbox` via
      `pnpm dlx shadcn@latest add sheet slider radio-group textarea checkbox`, landing in
      `src/shared/ui/`; confirm each inherits theme tokens from `src/index.css` without manual
      edits (`docs/TEAMS.md` Regra 8 — adaptado via tema, não reescrito).

**Checkpoint**: New primitives available to every story below.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cross-cutting infrastructure used by more than one story, that is not itself a
dedicated page.

**⚠️ CRITICAL**: Complete before starting US3, US4, US5 or US6 (US1 and US2 do not depend on this
phase and may start in parallel with it).

- [X] T002 [P] Add a `requireSession` route-guard helper to the `auth` domain's public API
      (`src/domains/auth/index.ts`, implementation in `src/domains/auth/hooks/use-require-session.ts`)
      that a route's `beforeLoad` can call to redirect an unauthenticated visitor to
      `/login?redirect=<rota solicitada>` (FR-007, FR-012; research.md D7). Consumed by the route
      tasks in US4 (T043), US5 (T049) and US6 (T055).
- [X] T003 [P] Extend `e2e/design-system/helpers.ts` (or a new shared `e2e/support/helpers.ts`
      re-exporting it) with a `seedCartItem(page, { nftId, editionId, quantity })` helper that adds
      an item to the cart through the mocked API, mirroring the existing `signIn` helper's
      direct-`fetch` pattern. Consumed by the test tasks in US3 (T034), US4 (T044) and US5 (T050).

**Checkpoint**: Foundation ready — US3/US4/US5/US6 implementation can begin.

---

## Phase 3: User Story 1 - Descobrir NFTs no catálogo/Início (Priority: P1) 🎯 MVP

**Goal**: catálogo completo (hero, filtros, busca, ordenação, paginação, atualização em tempo real)
em `/`, com paridade total entre 1440 px e 390 px.

**Independent Test**: carregar `/` sem sessão prévia; aplicar facetos/preço/ordenação e confirmar que
a grade e a paginação respondem; redimensionar para 390 px e confirmar que os mesmos controles ficam
acessíveis via busca/`Sheet` + `Dock`.

### Implementation for User Story 1

- [X] T004 [P] [US1] Criar `HeroBanner` (headline, CTA "Explorar", carrossel de destaques) em
      `src/pages/home/components/HeroBanner.tsx`, conforme `Início.png`.
- [X] T005 [P] [US1] Criar `CatalogFilters` (facetos de coleção, `slider` de faixa de preço, facetos
      de rede) em `src/pages/home/components/CatalogFilters.tsx`, lendo/escrevendo `CatalogQuery`
      pelos search params da rota (TanStack Router).
- [X] T006 [US1] Criar `CatalogFiltersSheet` (envolve `CatalogFilters` no `Sheet` do T001 para o
      controle de busca/filtro mobile) em `src/pages/home/components/CatalogFiltersSheet.tsx`
      (depende de T001, T005).
- [X] T007 [P] [US1] Criar `NftCard` e `NftGrid` (imagem, nome, preço, badge de raridade, ações
      rápidas de favoritar/adicionar ao carrinho) em `src/pages/home/components/NftCard.tsx` e
      `NftGrid.tsx`, consumindo os hooks já existentes `useFavorites`/`useToggleFavorite`
      (`domains/favorites`) e `useAddToCart` (`domains/cart`).
- [X] T008 [US1] Conectar `NftCard`/`NftGrid` ao hook já existente `use-catalog-realtime-sync`
      (`domains/catalog`) para refletir `nft.updated` sem reload, ignorando eventos com `version`
      menor ou igual à já renderizada (data-model.md) (depende de T007).
- [X] T009 [P] [US1] Criar `SortBar` (abas "Todos os NFTs/Novos lançamentos/Em alta" + `select` de
      ordenação) em `src/pages/home/components/SortBar.tsx`.
- [X] T010 [P] [US1] Criar `CatalogPagination` em `src/pages/home/components/CatalogPagination.tsx`,
      resetando para a página 1 sempre que `q`/`category`/`availability`/`minPrice`/`maxPrice` mudar
      (FR-002).
- [X] T011 [US1] Montar `HomePage` em `src/pages/home/HomePage.tsx` (Hero, Filters/Sheet, SortBar,
      NftGrid, Pagination, blocos de destaque/banners/"Diário da Cunhagem"/newsletter do
      `Início.png`), exportada por `src/pages/home/index.ts` (depende de T004–T010).
- [X] T012 [US1] Substituir o placeholder de `src/app/routes/index.tsx` por `HomePage`, validando
      `CatalogQuery` dos search params com Zod (depende de T011).
- [X] T013 [US1] Estados de "nenhum resultado" e erro de rede na grade (edge cases do spec) em
      `src/pages/home/components/NftGrid.tsx` (depende de T007).

### Tests for User Story 1

- [X] T014 [P] [US1] Playwright `e2e/home/catalog.spec.ts`: filtrar por coleção/preço reseta para a
      página 1; trocar ordenação muda a ordem da grade; combinação de filtros sem resultado mostra o
      estado vazio.
- [X] T015 [P] [US1] Playwright `e2e/home/catalog.spec.ts` (ou arquivo irmão): regressão visual +
      `hasNoHorizontalScroll` + `runAxe` em 390/768/1440 px (padrão de `e2e/design-system/`).

**Checkpoint**: Home utilizável de forma independente.

---

## Phase 4: User Story 2 - Autenticar via Login / Cadastro (Priority: P1)

**Goal**: diálogo único "Entrar | Criar conta", reaproveitado pelas rotas `/login` e `/signup`.

**Independent Test**: abrir o diálogo a partir de qualquer página, submeter login válido e confirmar
sessão + fechamento do diálogo; repetir trocando para "Criar conta".

### Implementation for User Story 2

- [X] T016 [P] [US2] Completar a camada `api` do domínio `auth` (`login`, `signup`, `logout`, query
      de sessão) em `src/domains/auth/api/queries.ts`.
- [X] T017 [US2] Completar os hooks do domínio `auth` (`useSession`, `useLogin`, `useSignup`) em
      `src/domains/auth/hooks/`, mesclando o carrinho de visitante (`MergeCartRequest`) e invalidando
      a query key do carrinho (`CART_QUERY_KEY`) após sucesso (FR-008) (depende de T016).
- [X] T018 [P] [US2] Criar `AuthDialog` (abas Entrar/Criar conta, validação Zod, erros inline,
      "Continuar com Google/Facebook" simulados) em `src/domains/auth/components/AuthDialog.tsx`
      (contracts/auth-dialog.md) (depende de T017).
- [X] T019 [US2] Exportar `AuthDialog` e os hooks de sessão pela API pública do domínio
      (`src/domains/auth/index.ts`) (depende de T016–T018).
- [X] T020 [P] [US2] Criar `LoginPage`/`SignupPage` (mesmo `AuthDialog`, `defaultTab` diferente) em
      `src/pages/login/LoginPage.tsx` e `src/pages/signup/SignupPage.tsx`, exportadas por cada
      `index.ts` (depende de T019).
- [X] T021 [P] [US2] Adicionar `src/app/routes/login.tsx` e `src/app/routes/signup.tsx`, propagando o
      search param `redirect` (depende de T020).
- [X] T022 [US2] Ligar a ação "Entrar" da `Navbar` (`src/app/layout/Navbar.tsx`) ao fluxo de login e
      refletir o `SessionUser` autenticado (depende de T017).
- [X] T023 [US2] Erros inline específicos (senha incorreta, e-mail já cadastrado, confirmação de
      senha divergente) em `AuthDialog` (depende de T018).

### Tests for User Story 2

- [X] T024 [P] [US2] Playwright `e2e/auth/dialog.spec.ts`: login com sucesso, login com senha
      incorreta, cadastro com sucesso, conflito de e-mail duplicado, round-trip do `redirect` a
      partir de uma rota protegida.
- [X] T025 [P] [US2] Playwright: regressão visual + a11y do diálogo aberto em 390/768/1440 px.

**Checkpoint**: Autenticação utilizável de forma independente (demais histórias semeiam sessão via
API nos testes, como o helper `signIn` já faz hoje).

---

## Phase 5: User Story 3 - Gerenciar o carrinho de NFTs (Priority: P2)

**Goal**: ajustar quantidades, remover linhas, aplicar cupom e ver o resumo em `/cart`.

**Independent Test**: semear o carrinho via API, abrir `/cart`, alterar quantidade e confirmar
recomputo dos totais; aplicar cupom válido/ inválido; remover todas as linhas e confirmar o estado
vazio.

### Implementation for User Story 3

- [X] T026 [P] [US3] Adicionar `updateCartItem`, `removeCartItem`, `applyCoupon`, `removeCoupon` e
      `cartQuote` a `src/domains/cart/api/queries.ts` (mesmo padrão de `addCartItem` já existente).
- [X] T027 [US3] Criar `useUpdateCartItem` com **atualização otimista + rollback** (research.md D5)
      em `src/domains/cart/hooks/use-update-cart-item.ts` (depende de T026).
- [X] T028 [P] [US3] Criar `useRemoveCartItem`, `useApplyCoupon`, `useRemoveCoupon` em
      `src/domains/cart/hooks/` (depende de T026).
- [X] T029 [P] [US3] Criar `CartLineList` (imagem, nome, ID do token, preço, stepper, remover) em
      `src/pages/cart/components/CartLineList.tsx`.
- [X] T030 [P] [US3] Criar `CartSummary` (campo de cupom, subtotal/desconto/taxa de rede/total,
      "Conectar e finalizar") em `src/pages/cart/components/CartSummary.tsx`.
- [X] T031 [P] [US3] Criar `EmptyCart` em `src/pages/cart/components/EmptyCart.tsx`.
- [X] T032 [US3] Montar `CartPage` em `src/pages/cart/CartPage.tsx` (+ carrossel "Colecionadores
      também viram" reaproveitando `NftCard` do US1), exportada por `src/pages/cart/index.ts`
      (depende de T027–T031).
- [X] T033 [US3] Adicionar `src/app/routes/cart.tsx`; "Conectar e finalizar" navega para `/checkout`,
      passando por `/login?redirect=/checkout` quando deslogado (depende de T032).

### Tests for User Story 3

- [X] T034 [P] [US3] Playwright `e2e/cart/cart.spec.ts` (usa `seedCartItem` de T003): mudança de
      quantidade recomputa totais, remover a última linha mostra o estado vazio, cupom inválido não
      altera totais, rollback otimista em `quantity_exceeds_stock`.
- [X] T035 [P] [US3] Playwright: regressão visual + a11y em 390/768/1440 px.

**Checkpoint**: Carrinho utilizável de forma independente.

---

## Phase 6: User Story 4 - Concluir Pagamento/Checkout (Priority: P2)

**Goal**: formulário do colecionador + seleção de carteira + confirmação da compra em `/checkout`.

**Independent Test**: com sessão e carrinho semeados via API, preencher todos os campos obrigatórios,
selecionar uma carteira e confirmar a compra; validar bloqueio de submit com campo vazio; validar
retry sem duplicar pedido.

### Implementation for User Story 4

- [X] T036 [P] [US4] Criar o utilitário de chave de idempotência atrelada a `Quote.signature`
      (research.md D4) em `src/domains/checkout/model/idempotency.ts`.
- [X] T037 [P] [US4] Adicionar `createOrder` a `src/domains/orders/api/queries.ts` e `useCreateOrder`
      (usa a chave de T036) em `src/domains/orders/hooks/use-create-order.ts` (depende de T036).
- [X] T038 [P] [US4] Adicionar `listWallets` a `src/domains/wallets/api/queries.ts` e `useWallets` em
      `src/domains/wallets/hooks/use-wallets.ts`.
- [X] T039 [P] [US4] Criar `CollectorForm` (react-hook-form + Zod; campos de `contracts/checkout.md`,
      incluindo "Usar outra carteira?") em `src/pages/checkout/components/CollectorForm.tsx`.
- [X] T040 [P] [US4] Criar `WalletPicker` (`radio-group` de carteiras salvas + opção de conectar) em
      `src/pages/checkout/components/WalletPicker.tsx` (depende de T038).
- [X] T041 [P] [US4] Criar `OrderSummary` (reaproveita a `Quote`, mostra `QuoteIssue`s) em
      `src/pages/checkout/components/OrderSummary.tsx`.
- [X] T042 [US4] Montar `CheckoutPage` em `src/pages/checkout/CheckoutPage.tsx`: revalida a cotação no
      submit, bloqueia com `Quote.purchasable === false` ou campos inválidos (FR-014), chama
      `useCreateOrder`, navega para `/orders/$orderId` (depende de T037, T039–T041).
- [X] T043 [US4] Adicionar `src/app/routes/checkout.tsx` com `beforeLoad` usando o guard de T002 e
      redirecionando para `/cart` quando o carrinho está vazio/não comprável (depende de T002, T042).

### Tests for User Story 4

- [X] T044 [P] [US4] Playwright `e2e/checkout/checkout.spec.ts` (usa `seedCartItem` de T003):
      validação de campo obrigatório bloqueia submit, fluxo feliz chega à confirmação, retry após
      timeout simulado não duplica o pedido.
- [X] T045 [P] [US4] Playwright: regressão visual + a11y em 390/768/1440 px.

**Checkpoint**: Checkout utilizável de forma independente.

---

## Phase 7: User Story 5 - Ver a confirmação do pedido (Priority: P2)

**Goal**: recibo (ou estado pendente/recusado/não encontrado) em `/orders/$orderId`.

**Independent Test**: completar um checkout (US4) e confirmar o recibo completo; requisitar
diretamente um pedido pendente, um recusado e um inexistente/de outro usuário.

### Implementation for User Story 5

- [X] T046 [P] [US5] Adicionar `getOrder` e a assinatura de `order.updated` a
      `src/domains/orders/api/queries.ts` / `src/domains/orders/hooks/use-order.ts`.
- [X] T047 [P] [US5] Criar `Receipt`, `PendingState`, `DeclinedState` e `NotFoundState` em
      `src/pages/order-confirmation/components/`.
- [X] T048 [US5] Montar `OrderConfirmationPage` em
      `src/pages/order-confirmation/OrderConfirmationPage.tsx`, alternando por `Order.status`/não
      encontrado, exportada por `index.ts` (depende de T046, T047).
- [X] T049 [US5] Adicionar `src/app/routes/orders.$orderId.tsx` com `beforeLoad` (guard de T002) e
      checagem de posse do pedido, exibindo `NotFoundState` em vez de dado de outro usuário (FR-023)
      (depende de T002, T048).

### Tests for User Story 5

- [X] T050 [P] [US5] Playwright `e2e/order-confirmation/order-confirmation.spec.ts` (usa
      `seedCartItem`/fluxo de T003 para gerar um pedido): recibo confirmado com todos os campos e
      link do explorador, estado pendente, estado recusado, não encontrado para `orderId` estranho.
- [X] T051 [P] [US5] Playwright: regressão visual + a11y em 390/1440 px.

**Checkpoint**: Confirmação de pedido utilizável de forma independente.

---

## Phase 8: User Story 6 - Gerenciar carteiras na conta (Priority: P3)

**Goal**: carteira principal + secundária em `/account/wallets`, ao lado do Perfil do Colecionador.

**Independent Test**: salvar a carteira principal, recarregar e confirmar persistência; adicionar
secundária marcando "Igual à carteira principal" e confirmar a cópia dos valores.

### Implementation for User Story 6

- [X] T052 [P] [US6] Adicionar `createWallet`/`updateWallet` a `src/domains/wallets/api/queries.ts` e
      `useSaveWallet` em `src/domains/wallets/hooks/use-save-wallet.ts` (reaproveita o `listWallets`
      de T038).
- [X] T053 [P] [US6] Criar `WalletForm` (slots primário/secundário, cópia "Igual à carteira
      principal" per research.md D3) em `src/pages/wallets/components/WalletForm.tsx`.
- [X] T054 [US6] Montar `WalletsPage` em `src/pages/wallets/WalletsPage.tsx`, reaproveitando o
      `SideMenu`/navegação de conta já construído para `ProfilePage`, exportada por `index.ts`
      (depende de T052, T053).
- [X] T055 [US6] Adicionar `src/app/routes/account.wallets.tsx` (mesmo padrão de
      `account.profile.tsx`) com `beforeLoad` usando o guard de T002 (depende de T002, T054).

### Tests for User Story 6

- [X] T056 [P] [US6] Playwright `e2e/wallets/wallets.spec.ts`: salvar carteira principal persiste
      após reload; adicionar secundária + "Igual à carteira principal" copia os valores.
- [X] T057 [P] [US6] Playwright: regressão visual + a11y em 390/1440 px.

**Checkpoint**: Todas as 6 histórias funcionam de forma independente.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T058 [P] Atualizar `docs/TEAMS.md` (status das rotas) e o `README.md` de cada página tocada,
      conforme a constituição ("Mudanças de estrutura MUST atualizar docs/TEAMS.md e o README da
      página afetada").
- [X] T059 [P] Rodar `pnpm check:tokens` e corrigir cores/espaçamentos literais introduzidos pelos
      novos componentes.
- [X] T060 Rodar `pnpm lint && pnpm typecheck && pnpm build` e corrigir qualquer violação nas 6
      telas.
- [X] T061 [P] Rodar `pnpm lighthouse` em `/`, `/cart` e `/checkout`, corrigindo regressões de
      acessibilidade abaixo de 95.
- [X] T062 Executar manualmente os 6 cenários de `quickstart.md` como validação final.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente.
- **Foundational (Phase 2)**: pode rodar em paralelo com US1/US2; **bloqueia** US3, US4, US5, US6.
- **US1 (Phase 3)** e **US2 (Phase 4)**: dependem só do Setup; são independentes entre si.
- **US3 (Phase 5)**: depende do Foundational; funcionalmente mais valiosa depois de US1 (precisa de
  itens no catálogo para adicionar ao carrinho), mas testável isoladamente semeando o carrinho via
  API.
- **US4 (Phase 6)**: depende do Foundational e, em valor, de US3 (carrinho) — testável isoladamente
  semeando carrinho + sessão via API.
- **US5 (Phase 7)**: depende do Foundational e, em valor, de US4 (precisa de um pedido) — testável
  isoladamente semeando um pedido via API.
- **US6 (Phase 8)**: depende do Foundational; independente das demais telas de compra.
- **Polish (Phase 9)**: depende de todas as histórias desejadas estarem completas.

### Parallel Opportunities

- T001 (Setup) e T002–T003 (Foundational) podem rodar em paralelo entre si.
- US1 e US2 podem ser implementadas em paralelo por desenvolvedores diferentes assim que o Setup
  terminar.
- Dentro de cada história, todas as tasks marcadas `[P]` (componentes/hooks em arquivos distintos)
  rodam em paralelo; as tasks de montagem da página (`HomePage`, `CheckoutPage` etc.) e de rota
  esperam suas dependências.
- As tasks de teste `[P]` de uma história rodam em paralelo entre si e podem começar assim que a
  implementação da história estiver pronta.

## Parallel Example: User Story 1

```bash
# Depois do Setup (T001), em paralelo:
Task: "Criar HeroBanner em src/pages/home/components/HeroBanner.tsx"
Task: "Criar CatalogFilters em src/pages/home/components/CatalogFilters.tsx"
Task: "Criar NftCard e NftGrid em src/pages/home/components/{NftCard,NftGrid}.tsx"
Task: "Criar SortBar em src/pages/home/components/SortBar.tsx"
Task: "Criar CatalogPagination em src/pages/home/components/CatalogPagination.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar a Fase 1 (Setup).
2. Completar a Fase 3 (US1 — Home/Catálogo).
3. **Parar e validar**: cenário 1 de `quickstart.md`.
4. Demonstrar o catálogo funcionando isoladamente (ainda sem autenticação/compra).

### Incremental Delivery

1. Setup + Foundational prontos.
2. US1 (Home) → valida → demo (MVP).
3. US2 (Auth) → valida → demo (visitante agora pode criar conta/entrar).
4. US3 (Carrinho) → valida → demo.
5. US4 (Checkout) → valida → demo (loop de compra fechado até a confirmação).
6. US5 (Confirmação de pedido) → valida → demo.
7. US6 (Carteiras) → valida → demo.
8. Cada história soma valor sem quebrar as anteriores.

## Notes

- `[P]` = arquivos diferentes, sem dependência de tasks incompletas.
- `[Story]` mapeia a task à história de usuário correspondente (rastreabilidade com `spec.md`).
- Rotas protegidas (US4, US5, US6) reaproveitam o mesmo guard (T002) — não reimplementar por rota.
- Testes seguem o padrão já existente em `e2e/design-system/helpers.ts` (`VIEWPORTS`, `signIn`,
  `hasNoHorizontalScroll`, `runAxe`); estender esse arquivo em vez de duplicar utilitários.
- Evitar: tasks vagas, duas tasks `[P]` tocando o mesmo arquivo, dependências entre histórias que
  quebrem a independência exigida pelo spec.
