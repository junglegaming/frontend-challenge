---

description: "Task list for 003-checkout-payment"
---

# Tasks: Página de Pagamento (Checkout completo)

**Input**: Design documents from `specs/003-checkout-payment/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/checkout-page.md, quickstart.md

**Tests**: incluídos — a constitution (princípio VII) exige E2E Playwright para fluxos críticos.

**Escopo**: TODAS as tarefas tocam apenas `src/pages/checkout/**` e `e2e/checkout/**`. Domínios, `shared/`,
mocks, rotas e helpers de E2E (`e2e/design-system/helpers.ts`) são somente leitura.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1–US5 de `spec.md`

---

## Phase 1: Setup

- [X] T001 Criar as pastas `src/pages/checkout/model/` e `src/pages/checkout/hooks/` e atualizar
      `src/pages/checkout/README.md` (domínios usados: `cart`, `wallets`, `orders`, `checkout`, `auth`,
      `profile`; etapas formulário → revisão → envio → resultado).

---

## Phase 2: Foundational (bloqueia todas as histórias)

- [X] T002 Criar a máquina de estados pura em `src/pages/checkout/model/checkout-flow.ts`: tipo
      `CheckoutState` com etapas `form` | `review { reviewedQuote, change, error }` |
      `submitting { reviewedQuote }` | `pending { orderId }` | `declined { orderId, reason }`; ações
      `NEXT(quote)`, `BACK`, `WALLET_CHANGED`, `NETWORK_CHANGED`, `WALLET_DISCONNECTED`, `CONFIRM`,
      `QUOTE_CHANGED(change, quote)`, `SUBMIT_FAILED(message)`, `ORDER_CREATED(orderId)`, `ORDER_CONFIRMED`,
      `ORDER_DECLINED(reason)`, `RETRY`, `RESUME_PENDING(orderId)`. Regras de data-model.md: troca de
      carteira/rede/desconexão em `review` volta para `form`; `QUOTE_CHANGED` só age em `review`/`submitting`
      (volta para `review` com `change`); `ORDER_CONFIRMED`/`ORDER_DECLINED` só saem de `pending`;
      `pending`/`declined` ignoram eventos de cotação. Exportar `checkoutReducer` e `initialCheckoutState`.
- [X] T003 [P] Criar `src/pages/checkout/model/quote-diff.ts` com `diffQuotes(previous: Quote, current: Quote):
      QuoteChange | null` — `lines` (preço por `itemId` que mudou: `{ itemId, name, previous, current }`),
      `removed` (linhas que sumiram), `issues` (= `current.issues`), `networkFee`/`total` (`{ previous,
      current } | null`), `blocking` (= `!current.purchasable`); retorna `null` se `signature` igual e sem
      issues. Comparar valores com `eth` de `@/shared/lib/eth`, sem recalcular totais.
- [X] T004 [P] Criar `src/pages/checkout/model/checkout-draft.ts`: `readDraft(userId)`, `writeDraft(draft)`,
      `clearDraft()` em `sessionStorage['checkout:draft']`, validado com Zod: `userId` obrigatório (diferente
      da sessão → descartar), `collector { fullName, email, note? }`, `network: Network | null`,
      `walletId: string | null`, `pendingOrderId: string | null`, `savedAt` ISO ("rascunhos com mais de 24 h
      são descartados"). Nunca guardar conexão de carteira. Tolerar `sessionStorage` indisponível (try/catch).
- [X] T005 [P] Criar `src/pages/checkout/components/CheckoutSkeleton.tsx` (skeleton das duas colunas com
      dimensões estáveis, usando `Skeleton` de `@/shared/ui/skeleton`) e região única `aria-live="polite"`
      reutilizável (`LiveAnnouncer` no mesmo arquivo ou `components/LiveRegion.tsx`).

**Checkpoint**: modelo pronto — histórias podem começar.

---

## Phase 3: User Story 1 - Preencher, revisar e confirmar (P1) 🎯 MVP

**Goal**: formulário pré-preenchido → revisão → confirmação → recibo, com foco/erros acessíveis.

**Independent Test**: cenário `default`, `/checkout` → preencher → revisar → confirmar → `/orders/<id>`
confirmado; item comprado saiu do carrinho.

- [X] T006 [US1] Ajustar `src/pages/checkout/components/CollectorForm.tsx`: adicionar `walletId` ao schema
      ("Selecione ou adicione uma carteira."), manter `fullName` 3–60, `email` válido, `network` em `NETWORKS`,
      `note` ≤ 280; `useCollectorForm` com `shouldFocusError: true`; pré-preencher nome/e-mail com
      `useProfile()` via `form.reset` uma única vez e só se o campo estiver vazio (R7).
- [X] T007 [P] [US1] Criar `src/pages/checkout/components/ReviewPanel.tsx`: título focável
      (`tabIndex={-1}`), itens/edições/quantidades, carteira (apelido + endereço abreviado), rede
      (`NETWORK_LABELS`), subtotal, desconto, taxa de rede e total da `reviewedQuote`; botões "Voltar e editar"
      e "Confirmar compra" (desabilitado + "Confirmando…" em `submitting`).
- [X] T008 [US1] Reescrever `src/pages/checkout/CheckoutPage.tsx` com `useReducer(checkoutReducer)`: em
      `form`, ação principal "Revisar pedido" valida o formulário (`form.handleSubmit`) e despacha
      `NEXT(quote)`; em `review`, "Confirmar compra" despacha `CONFIRM`, faz `quote.refetch()`, cria o pedido
      com `idempotencyKeyFor(signature)` e trata erros (`isApiError`: 422 → `form.setError` nos campos e volta
      para `form`; demais → `SUBMIT_FAILED`). Carrinho vazio → `/cart`. Foco no título ao mudar de etapa.
      Temporariamente, `ORDER_CREATED` navega para `/orders/$orderId` (substituído em US4).
- [X] T009 [US1] Em `src/pages/checkout/CheckoutPage.tsx`, usar `CheckoutSkeleton` enquanto cotação/carrinho
      carregam e estado de erro com "Tentar novamente" (`refetch`) sem perder o formulário.
- [X] T010 [US1] Atualizar `e2e/checkout/checkout.spec.ts`: validação bloqueia "Revisar pedido" e foca o
      primeiro campo inválido; fluxo completo revisar → confirmar → `/orders/` (ajustar ao novo passo de
      conexão quando US2 entrar); voltar da revisão preserva os campos.

**Checkpoint**: compra com revisão funcionando.

---

## Phase 4: User Story 2 - Conectar carteira e escolher rede (P1)

**Goal**: carteira com redes compatíveis e conexão simulada (conectar/recusar/desconectar).

**Independent Test**: `default` conecta → "Conectada"; desconectar bloqueia a ação principal;
`?scenario=wallet-rejected` mostra recusa + "Tentar novamente".

- [X] T011 [P] [US2] Criar `src/pages/checkout/hooks/use-wallet-connection.ts`: `useMutation` que faz
      `api.post<WalletConnection>('/wallets/' + walletId + '/connect', { network })` (`@/shared/api/http`);
      estado `idle | connecting | connected { walletId, network } | rejected { message }`; `WALLET_REJECTED` →
      `rejected`; 422 com `fields.network` → mensagem de rede incompatível; `disconnect()` volta a `idle`.
      Comentário: candidata a subir para `domains/wallets` após combinar com o time dono (plan.md).
- [X] T012 [P] [US2] Criar `src/pages/checkout/components/WalletConnectionStatus.tsx`: texto + ícone
      (`@/shared/icons`) para Desconectada / Conectando… / Conectada / Recusada; botões "Conectar",
      "Tentar novamente", "Desconectar"; status anunciado no `aria-live`.
- [X] T013 [US2] Ajustar `src/pages/checkout/components/WalletPicker.tsx`: mostrar provedor
      (`PROVIDER_LABELS`) e redes suportadas de cada carteira; pré-selecionar a principal; aviso
      "Esta carteira não suporta a rede selecionada." quando `!wallet.networks.includes(network)`; integrar
      `WalletConnectionStatus`; manter o cadastro inline (`WalletForm`) e esconder "Usar outra carteira?"
      quando principal + secundária existem.
- [X] T014 [US2] Em `src/pages/checkout/CheckoutPage.tsx`: trocar carteira ou rede chama `disconnect()` e
      despacha `WALLET_CHANGED`/`NETWORK_CHANGED`; "Revisar pedido" e "Confirmar compra" exigem
      `connected` para a carteira+rede atuais (FR-012).
- [X] T015 [P] [US2] Criar `e2e/checkout/wallet-connection.spec.ts`: conectar/desconectar no `default`;
      recusa no `wallet-rejected`; rede incompatível bloqueia; usuário sem carteira cadastra e usa na hora.

**Checkpoint**: US1 + US2 = compra completa conforme o desafio.

---

## Phase 5: User Story 3 - Revalidar e exigir nova confirmação (P1)

**Goal**: mudanças de preço/estoque/cupom/taxa (no envio ou em tempo real) mostradas e reconfirmadas.

**Independent Test**: `?scenario=price-change-at-checkout` → confirmar não cria pedido, mostra antigo → novo,
exige nova confirmação; `sold-out-at-checkout` bloqueia com link para o carrinho.

- [X] T016 [P] [US3] Criar `src/pages/checkout/components/QuoteChangedNotice.tsx` (`role="alert"`): título
      "Os valores do pedido mudaram. Revise e confirme novamente.", linhas antigo → novo, itens removidos,
      issues (`sold_out`, `quantity_exceeds_stock`, `coupon_removed`), taxa/total; se `blocking`, link
      "Ajustar carrinho" para `/cart`.
- [X] T017 [US3] Em `src/pages/checkout/CheckoutPage.tsx`, antes de enviar: se o `refetch` trouxer
      `signature` diferente ou `!purchasable`, despachar `QUOTE_CHANGED(diffQuotes(reviewed, fresh), fresh)`
      sem chamar `POST /orders`; erros `QUOTE_STALE`/`AVAILABILITY_CONFLICT` do `POST /orders` fazem refetch
      + o mesmo `QUOTE_CHANGED`. `ReviewPanel` mostra `QuoteChangedNotice` e usa a nova cotação.
- [X] T018 [P] [US3] Criar `src/pages/checkout/hooks/use-checkout-realtime.ts`: `realtimeClient.subscribe(
      'nft.updated')` → se `nftId` estiver nas linhas da cotação, `invalidateQueries` da cotação da rede atual
      e chamar `onQuoteOutdated()`; `realtimeClient.onReconnect` → refetch da cotação; liberar ambos no cleanup.
- [X] T019 [US3] Integrar `use-checkout-realtime` em `src/pages/checkout/CheckoutPage.tsx`: em `review`,
      a nova cotação gera `QUOTE_CHANGED`; em `form`, só anuncia "O resumo foi atualizado." no `aria-live`.
- [X] T020 [US3] Ajustar `src/pages/checkout/components/OrderSummary.tsx` para destacar linhas alteradas
      (antigo riscado → novo, com texto, não só cor) quando receber `change`.
- [X] T021 [P] [US3] Criar `e2e/checkout/quote-change.spec.ts`: `price-change-at-checkout` (nenhum pedido,
      diff visível, segunda confirmação conclui); `sold-out-at-checkout` (bloqueado + link); evento
      `nft.updated` via `window.__nftMock.realtime` durante a revisão invalida a revisão.

**Checkpoint**: nenhuma compra com valores não vistos.

---

## Phase 6: User Story 4 - Envio seguro: pendente e recusado (P2)

**Goal**: sem duplicidade; pendente/recusado na própria página; retomada após refresh.

**Independent Test**: `order-timeout` (retry recupera o mesmo pedido), `payment-declined` (motivo + itens no
carrinho + tentar de novo), refresh durante "Processando" retoma o mesmo pedido.

- [X] T022 [P] [US4] Criar `src/pages/checkout/hooks/use-order-outcome.ts`: dado `orderId`, usar `useOrder`
      (`@/domains/orders`); `confirmed` → invalidar `CART_QUERY_KEY`, `clearDraft()`, navegar para
      `/orders/$orderId`; `declined` → invalidar carrinho/cotação e devolver `declineReason`.
- [X] T023 [P] [US4] Criar `src/pages/checkout/components/OrderOutcome.tsx`: `pending` ("Processando
      pagamento", id do pedido, `aria-busy`) e `declined` (`role="alert"`, motivo, "Tentar novamente").
- [X] T024 [US4] Em `src/pages/checkout/CheckoutPage.tsx`: `ORDER_CREATED` passa a ir para `pending`
      (remover a navegação temporária de T008) e grava `pendingOrderId` no rascunho; integrar
      `use-order-outcome` (`ORDER_CONFIRMED`/`ORDER_DECLINED`); `RETRY` volta a `form` com nova cotação.
      Erro `TIMEOUT`/rede → permanecer em `review` com "Não recebemos a confirmação a tempo. Tente novamente —
      o mesmo pedido será recuperado." (retry usa a mesma chave).
- [X] T025 [US4] Ao montar `src/pages/checkout/CheckoutPage.tsx`, se `readDraft(userId)?.pendingOrderId`
      existir, despachar `RESUME_PENDING(orderId)`.
- [X] T026 [P] [US4] Criar `e2e/checkout/order-outcome.spec.ts`: cliques repetidos → um pedido;
      `order-timeout` → retry recupera o mesmo id; `payment-declined` → motivo, itens no carrinho, tentar
      de novo; refresh em pendente retoma (usar `window.__nftMock.settleAllOrders()` para controlar o tempo).

**Checkpoint**: cenários de falha obrigatórios cobertos.

---

## Phase 7: User Story 5 - Sessão expirada (P3)

**Goal**: sessão expira → login → volta ao pagamento com os dados (mesmo usuário apenas).

**Independent Test**: `?scenario=short-session`, preencher, aguardar 30 s, revisar → login → `/checkout`
com campos restaurados.

- [X] T027 [US5] Em `src/pages/checkout/CheckoutPage.tsx`: salvar rascunho (`writeDraft`) a cada mudança do
      formulário/carteira/rede (debounce simples); em qualquer erro `isAuthError` da página, salvar,
      mostrar "Sua sessão expirou. Entre novamente para concluir a compra; seus dados foram guardados." e
      navegar para `/login?redirect=/checkout`.
- [X] T028 [US5] Ao montar, restaurar o rascunho com `readDraft(session.userId)` (descarta se o usuário for
      outro); carteira volta selecionada mas desconectada; perfil (T006) só preenche campos vazios.
- [X] T029 [P] [US5] Criar `e2e/checkout/session.spec.ts`: expiração preserva dados após novo login; login
      com outro usuário não vê dados do anterior.

---

## Phase 8: Polish & Cross-Cutting

- [X] T030 Revisar layout de `src/pages/checkout/CheckoutPage.tsx` em 390/768/1440 px (duas colunas ≥ 1024,
      coluna única abaixo) e contra o frame "Pagamento" do Figma; apenas tokens e `shared/ui`.
- [X] T031 Atualizar no `e2e/checkout/checkout.spec.ts` o teste de a11y (axe sem violações nas etapas form e
      review) e regenerar as baselines visuais de checkout (`pnpm test:e2e:update e2e/checkout`).
- [X] T032 Rodar `pnpm typecheck`, `pnpm lint`, `pnpm check:tokens`, `pnpm build` e `pnpm test:e2e
      e2e/checkout`; corrigir o que falhar dentro do escopo.
- [X] T033 Executar o roteiro manual de `specs/003-checkout-payment/quickstart.md` e confirmar com
      `git diff --stat main` que só `src/pages/checkout/**`, `e2e/checkout/**` e `specs/003-checkout-payment/**`
      mudaram.

---

## Dependencies & Execution Order

- Setup (T001) → Foundational (T002–T005) → histórias.
- **US1** (T006–T010) é a base da página; **US2** (T011–T015) depende de T008 para integrar.
- **US3** (T016–T021) depende de US1 (etapa de revisão). **US4** (T022–T026) depende de US1.
  **US5** (T027–T029) depende de T004 e US1.
- US3, US4 e US5 podem ser feitas em qualquer ordem após US1+US2; todas editam `CheckoutPage.tsx`, então
  as tarefas nesse arquivo são sequenciais.
- Polish (T030–T033) por último.

## Parallel Examples

- Foundational: T003, T004, T005 juntas (arquivos diferentes) depois de T002 ou em paralelo a ele.
- US2: T011 + T012 + T015 em paralelo; depois T013 → T014.
- US3: T016 + T018 + T021 em paralelo; depois T017 → T019 → T020.
- US4: T022 + T023 + T026 em paralelo; depois T024 → T025.

## Implementation Strategy

1. **MVP**: Setup + Foundational + US1 + US2 → compra com revisão e carteira conectada.
2. US3 (revalidação) → critério eliminatório do desafio.
3. US4 (pendente/recusado/timeout) → cenários de falha.
4. US5 (sessão) → retomada.
5. Polish + commit por fase na branch `maju`.
