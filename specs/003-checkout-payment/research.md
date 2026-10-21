# Research: Página de Pagamento (003-checkout-payment)

Restrição transversal a todas as decisões: **só `src/pages/checkout` e `e2e/checkout` são alterados**
(spec, Assumptions). Domínios, `shared/` e mocks são consumidos pela API pública, nunca editados.

## R1. Onde fica a lógica de fluxo (formulário → revisão → envio → resultado)

- **Decision**: uma máquina de estados pura (reducer) em `src/pages/checkout/model/checkout-flow.ts`, usada
  por `CheckoutPage` via `useReducer`. Etapas: `form` → `review` → `submitting` → `pending` →
  (`declined` | navegação para o recibo). A revisão é uma etapa da mesma rota.
- **Rationale**: deixa as transições testáveis e explícitas (FR-008, FR-011, FR-015), sem criar rota nova nem
  tocar no router de outros times.
- **Alternatives considered**: rota `/checkout/review` (exigiria mexer em `src/app/routes`, área comum, e
  complica o retorno após login); estado espalhado em vários `useState` (versão atual; difícil garantir que
  trocar carteira invalida a revisão).

## R2. Conexão simulada da carteira

- **Decision**: o mock já expõe `POST /wallets/:walletId/connect` (aceita, recusa com `WALLET_REJECTED`
  no cenário `wallet-rejected`, ou 422 se a rede não for suportada), mas o domínio `wallets` não exporta
  função/hook para ele. A página cria um hook local `use-wallet-connection.ts` que chama esse endpoint pelo
  cliente Axios compartilhado (`api` de `@/shared/api/http`) via `useMutation`. "Desconectar" é estado
  local (não há endpoint) e também é disparado ao trocar carteira/rede.
- **Rationale**: cumpre o desafio (conexão, recusa, desconexão) sem editar o domínio `wallets`. Importar
  `shared/` a partir de `pages/` é permitido pelas regras de dependência.
- **Alternatives considered**: adicionar `connectWallet` em `domains/wallets` (lugar ideal, mas é código de
  outro time — fica registrado como sugestão em Complexity Tracking do plano); simular a conexão só no
  cliente (violaria o princípio V: caminho de negócio fora da camada de rede).

## R3. Revalidação e diferença de valores (preço antigo → novo)

- **Decision**: ao entrar na revisão, a página guarda um *snapshot* da `Quote` (`reviewedQuote`). Antes de
  enviar, faz `refetch` da cotação; se `signature` mudou ou `purchasable` virou `false`, volta para a
  revisão com um `QuoteChange` calculado localmente (`model/quote-diff.ts`) comparando snapshot × atual
  (preço por linha, linhas removidas/esgotadas, cupom, taxa, total) e somando os `issues` da própria
  cotação. A resposta `409 QUOTE_STALE`/`AVAILABILITY_CONFLICT` do `POST /orders` (cenários
  `price-change-at-checkout` e `sold-out-at-checkout`) segue o mesmo caminho: refetch + diff + nova
  confirmação.
- **Rationale**: FR-010/FR-011 exigem mostrar *o que* mudou; a cotação do servidor continua sendo a única
  fonte dos valores (nenhum total é calculado na página, só comparado com `eth` de `shared/lib`).
- **Alternatives considered**: mostrar só os `issues` da cotação (não cobre mudança de taxa/total sem issue);
  calcular totais localmente (proibido: a cotação é a referência).

## R4. Mudanças em tempo real durante o checkout

- **Decision**: hook local `use-checkout-realtime.ts` assina `nft.updated` via `realtimeClient` (`shared`);
  se o `nftId` estiver nas linhas da cotação, invalida a query da cotação da rede atual e, se a etapa for
  `review`, dispara `QUOTE_CHANGED` na máquina (revisão invalidada + aviso em `aria-live`). Em
  `onReconnect`, refaz a cotação. Ambas as assinaturas são liberadas no unmount.
- **Rationale**: o `useCatalogRealtimeSync` global só atualiza caches do catálogo, não a cotação; a página
  precisa reagir sozinha (CHALLENGE §7, cenário 1–4). Duplicatas/eventos antigos já são descartados pelo
  `realtimeClient`.
- **Alternatives considered**: depender apenas da revalidação no envio (atende o bloqueio, mas não "informa a
  alteração e atualiza o resumo" durante a navegação).

## R5. Idempotência, pedido pendente e recuperação após refresh

- **Decision** (ajustada na implementação): a chave fica na própria tentativa, guardada no rascunho (R6) junto
  com a requisição ainda sem resposta (`attempt.unanswered`). O `idempotencyKeyFor` do domínio `checkout`
  guarda a chave só em memória e por assinatura, o que não sobrevive a refresh e reaproveitaria a chave de um
  pedido recusado. Depois de um timeout, a nova tentativa reenvia **a mesma requisição** sem revalidar, porque
  o pedido pode já existir e ter reservado estoque, o que muda a cotação. Ao reabrir a página com requisição
  sem resposta, ela é reenviada automaticamente. Depois de uma recusa, a tentativa é descartada (nova chave).
  Ao receber o pedido (`201` ou replay `200`), a página salva
  `{ userId, orderId }` no rascunho de checkout (R6) e acompanha com `useOrder(orderId)` (domínio `orders`,
  que já combina `order.updated`, polling REST de 2 s e reconciliação no reconnect).
  `confirmed` → invalida `CART_QUERY_KEY` e navega para `/orders/$orderId`; `declined` → etapa `declined`
  com `declineReason`, invalida carrinho/cotação, e "Tentar novamente" volta ao formulário (nova cotação →
  nova chave). Ao abrir a página com um `orderId` pendente salvo, retoma direto na etapa `pending`.
- **Rationale**: atende FR-013–FR-018 reaproveitando o que já existe; o mock já remove do carrinho só o que
  foi comprado na confirmação e libera estoque na recusa.
- **Alternatives considered**: navegar para `/orders/$orderId` logo após criar (versão atual; mostra pendente
  numa página de outro time e não deixa tentar de novo no pagamento após recusa).
- **Timeout**: o cliente usa `VITE_REQUEST_TIMEOUT_MS=8000` e o cenário `order-timeout` atrasa 12 s; o erro
  `TIMEOUT` mantém a etapa `review` com mensagem "Não confirmamos a resposta. Tente novamente — você não será
  cobrado duas vezes." e o retry usa a mesma chave.

## R6. Rascunho do checkout e sessão expirada

- **Decision**: `model/checkout-draft.ts` persiste em `sessionStorage` (chave `checkout:draft`) os dados do
  colecionador, rede, carteira escolhida e `pendingOrderId`, **marcados com o `userId`** da sessão. Ao
  abrir, só restaura se o `userId` bater; senão descarta. Conexão de carteira nunca é persistida. Erros
  `isAuthError` (401 `UNAUTHENTICATED`/`SESSION_EXPIRED`) em qualquer chamada da página salvam o rascunho,
  mostram aviso e navegam para `/login?redirect=/checkout`. O rascunho é apagado ao confirmar o pedido.
- **Rationale**: FR-019 e isolamento entre usuários (eliminatório). `sessionStorage` some ao fechar a aba e
  não guarda dados sensíveis (sem senha, sem conexão).
- **Alternatives considered**: `localStorage` (vaza entre abas/usuários por mais tempo); listener global de
  `onAuthError` (área comum `app/`, fora do escopo).

## R7. Pré-preenchimento com o perfil

- **Decision**: `useProfile()` (domínio `profile`) fornece nome e e-mail; aplicados com `form.reset` uma única
  vez, só se o rascunho restaurado não tiver valores.
- **Rationale**: FR-003 sem sobrescrever o que o usuário digitou.

## R8. Layout, skeletons e acessibilidade

- **Decision**: manter a composição atual (formulário + carteira à esquerda, resumo à direita em `lg`, coluna
  única abaixo). Usar apenas componentes de `shared/ui` (`Field`, `Input`, `Select`, `RadioGroup`, `Button`,
  `Skeleton`, `Badge`, `Card`) e tokens. Uma região `aria-live="polite"` única na página anuncia conexão,
  mudanças de valores, envio e recusa; erros bloqueantes usam `role="alert"`. Ao tentar avançar com erro,
  `setFocus` no primeiro campo inválido (react-hook-form `shouldFocusError`). Ao trocar de etapa, o foco
  vai para o título da etapa (`tabIndex={-1}`).
- **Rationale**: FR-020–FR-022 e princípio VI, sem criar componentes em `shared/ui`.

## R9. Testes

- **Decision**: ampliar `e2e/checkout/` com arquivos novos por história (`review.spec.ts`,
  `wallet-connection.spec.ts`, `quote-change.spec.ts`, `order-outcome.spec.ts`, `session.spec.ts`),
  selecionando cenários pelo parâmetro `?scenario=` já suportado pelo runtime de mocks e reusando os
  helpers de `e2e/design-system/helpers.ts` sem alterá-los. O teste existente de checkout completo é
  atualizado para o novo fluxo (conectar → revisar → confirmar) e as baselines visuais de checkout são
  regeneradas.
- **Rationale**: princípio VII e CHALLENGE §9 itens 6, 7, 9, 10, 11.
