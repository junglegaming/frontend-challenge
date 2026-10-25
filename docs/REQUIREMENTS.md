# Rastreabilidade dos requisitos

Cada requisito do [enunciado](CHALLENGE.md) ligado à implementação e à evidência que o comprova. Os testes ficam em `e2e/` e rodam em Chromium, nos projetos `desktop` (1440), `tablet` (768) e `mobile` (390), localmente e na CI (imagem Docker do Playwright).

Legenda: ✅ atendido e testado · ◐ atendido com ressalva (explicada na linha).

## Stack (§2)

| Tecnologia | Uso efetivo | Onde |
| --- | --- | --- |
| React + TypeScript | Strict, sem `any` (lint bloqueia) | `src/` |
| TanStack Router | Rotas file-based, `validateSearch` com Zod, guarda `_auth`, 404 | `src/routes/` |
| TanStack Query | Queries, mutations, otimismo, invalidação por eventos | `src/hooks/` |
| Axios | Único cliente REST, normaliza erros em `ApiError` | `src/api/client.ts` |
| Socket.IO | `socket.io-client` real, interceptado pelo MSW | `src/realtime/`, `src/mocks/socket.ts` |
| Tailwind + shadcn/ui | Tema com tokens do Figma, 12 componentes Radix adaptados (só os usados) | `src/styles.css`, `src/components/ui/` |
| MSW | REST + WebSocket, cenários, persistência e reset | `src/mocks/` |
| Playwright | 38 testes × 3 viewports, regressão visual | `e2e/` |
| Lighthouse | 3 execuções por página/perfil, relatórios versionados | `lighthouserc.*.json`, [LIGHTHOUSE.md](LIGHTHOUSE.md) |

## Telas e fluxos (§3)

| Requisito | Status | Implementação | Evidência |
| --- | :-: | --- | --- |
| Busca, filtros combináveis, ordenação e paginação na URL | ✅ | `routes/index.tsx`, `components/catalog/` | `catalog.spec` › busca, filtros combinados… |
| Mudança de filtro reinicia a paginação | ✅ | `useCatalogSearch` remove `page` | idem |
| Refresh e histórico restauram o estado | ✅ | search params da rota | idem (voltar + reload) |
| Resultado vazio, falha e respostas fora de ordem | ✅ | `EmptyState`, `ErrorState`, query key por parâmetros + `AbortSignal` | `catalog.spec` › vazio; › fora de ordem; `a11y-loading.spec` › falha transitória |
| Detalhe: acesso direto, inexistente, edição indisponível, limite | ✅ | `routes/nft.$nftId.tsx` | `detail.spec` |
| Favoritos persistem para o autenticado | ✅ | `useToggleFavorite` (otimista) | `favorites.spec` |
| Carrinho: adicionar, alterar, remover, respeitando disponibilidade | ✅ | `hooks/useCart.ts`, `OUT_OF_STOCK` no mock | `cart.spec`, `detail.spec` |
| Carrinho após refresh e preservado ao autenticar | ✅ | carrinho no servidor + `POST /cart/merge` | `cart.spec` |
| Cupom inválido/expirado | ✅ | `PUT /cart/coupon` → 422 | `cart.spec` |
| Resumo coerente com a API | ✅ | o cliente exibe `cart.summary`, sem recalcular | `cart.spec` (valores exatos) |
| Alterações de preço/disponibilidade com o carrinho aberto | ✅ | `useRealtimeSync` invalida o carrinho e anuncia | `realtime.spec` › carrinho aberto… |
| ETH em string com precisão | ✅ | `lib/eth.ts` (bigint) | `src/lib/eth.test.ts` |
| Pagamento: validação e revisão antes do envio | ✅ | `buyerSchema`, etapa "Revisar pedido" | `purchase.spec` |
| Carteiras cadastradas, rede, conexão, recusa e desconexão | ✅ | `WalletPicker`, `/wallets/:id/connect` | `account.spec` › carteiras; › recusa |
| Revalidar preço/disponibilidade/cupom/taxas antes de confirmar | ✅ | `QUOTE_STALE` + descarte da cotação ao receber evento | `realtime.spec` › preço alterado… |
| Sem pedidos duplicados (clique repetido, timeout) | ✅ | `Idempotency-Key` persistida antes do envio | `payment-failures.spec` |
| Pendente, confirmado e recusado, com recuperação após refresh/reconexão | ✅ | `routes/_auth/orders.$orderId.tsx`, reconciliação no `connect` | `realtime.spec` › queda de conexão…; `payment-failures.spec` › recusado |
| Confirmação só para pedido confirmado | ✅ | tela de espera até `order.updated` | `purchase.spec` |
| Falha preserva itens; confirmação remove só o comprado | ✅ | `resolveOrder` no mock | `payment-failures.spec`; `src/mocks/domain.test.ts` |
| Recibo é snapshot | ✅ | `receipt` congelado na criação | `purchase.spec` (preço muda depois, recibo não) |
| Cadastro, login, logout, sessão recuperável | ✅ | `hooks/useSession.ts` | `auth.spec` |
| Expiração na navegação e no checkout, preservando contexto | ✅ | `sessionEvents` + `redirect` + rascunho em `sessionStorage` | `auth.spec` › sessão expirada…; › relógio controlado |
| Logout/troca de usuário limpam cache e subscriptions | ✅ | `removePrivateQueries`, socket recriado por usuário | `auth.spec` › troca de usuário (verifica conexões do socket) |
| Perfil, avatar e senha com erros da API | ✅ | `components/profile/` | `account.spec` |
| Rotas inexistentes | ✅ | `notFoundComponent` | `detail.spec` |

## Integração e estado (§4)

| Requisito | Onde |
| --- | --- |
| Contratos tipados transporte → estado → UI | `schemas/` + `schema.parse` nos services |
| Estados de carregamento, vazio, erro, sucesso e background | skeletons com shimmer em toda request nova (inclusive troca de filtro e página), `EmptyState`, `ErrorState`, anúncio `aria-live` "Carregando NFTs…" |
| Invalidação após mutations e eventos | `hooks/`, `realtime/useRealtimeSync.ts` |
| Cancelamento/descarte de respostas obsoletas | `signal` repassado ao Axios + chave por parâmetros |
| Isolamento por usuário e parâmetros | `hooks/query-keys.ts` (`userId` nas chaves privadas) |
| Recuperação sem duplicar operações | idempotência do pedido; mutations sem retry automático |
| Atualização otimista com rollback | `useToggleFavorite` (`favorites.spec` › falha na mutation) |
| Política de cache/retries documentada | [ARCHITECTURE.md](../ARCHITECTURE.md#cache-retries-e-sincronização) |

## Mocks (§6) e tempo real (§7)

| Requisito | Onde / evidência |
| --- | --- |
| Mocks só na camada de rede | `src/mocks/` (nenhum componente/hook contém dados fictícios) |
| Estado consistente, persistência e reset | `mocks/db.ts`, botão "Resetar dados", `__kurioMock.reset()` |
| Lentidão, latência variável, timeout, offline, 4xx/5xx | cenários `slow`, `out-of-order`, `order-timeout`, `offline`, `server-error` |
| Dois usuários, cenários determinísticos | alice/bob; PRNG de seed fixa |
| Socket.IO compatível via MSW, exercitando `socket.io-client` | `mocks/socket.ts`; testes em `realtime.spec` |
| Mudanças refletidas em REST e eventos | `mocks/effects.ts` altera o `db` e emite pelo mesmo caminho |
| `nft.updated` / `order.updated` com identidade, recurso e versão | `schemas/events.ts` |
| Duplicatas e eventos antigos não regridem | `realtime.spec` › eventos duplicados ou antigos |
| Reconciliação após reconexão | `useRealtimeSync`: todo `connect` (inicial e reconexão) reconcilia o que é anterior ao handshake |
| Eventos de outra sessão não vazam | entrega por dono no servidor + socket por usuário |
| Listeners liberados no fim do ciclo de vida | cleanup do efeito (`removeAllListeners` + `disconnect`) |

## Interface, responsividade e acessibilidade (§8)

| Requisito | Status | Evidência |
| --- | :-: | --- |
| Fidelidade ao Figma | ◐ | Tokens e frames reproduzidos. Desvios justificados em [ARCHITECTURE.md](../ARCHITECTURE.md#decisões-de-ux-e-desvios-do-figma) |
| 390 / 768 / 1440 sem overflow | ✅ | `a11y-loading.spec` › sem overflow (contra a largura do dispositivo), rodando nos três projetos |
| Skeletons com shimmer e `prefers-reduced-motion` | ✅ | `.shimmer` só anima com `no-preference`; `a11y-loading.spec` › carregamento lento |
| Teclado, foco visível, foco em diálogos | ✅ | `a11y-loading.spec` › teclado |
| Labels e erros associados | ✅ | `a11y-loading.spec` › formulário anuncia erros |
| Feedback acessível de mutations e tempo real | ✅ | toasts com `aria-live` (sonner), avisos inline com `role="alert"` |
| Lighthouse Accessibility | ✅ | 100 nos quatro cenários |

## Testes (§9) e performance (§10)

| Requisito | Evidência |
| --- | --- |
| Itens 1–12 do enunciado | ver tabelas acima (cada linha cita o spec) |
| Chromium desktop e mobile | `playwright.config.ts` (desktop, tablet e mobile); `.github/workflows/ci.yml` |
| Regressão visual de início, detalhe, carrinho e pagamento | `e2e/visual.spec.ts` + baselines darwin e linux nos três viewports |
| Estado isolado, relógio, latência e eventos controlados | `e2e/fixtures.ts`, `page.clock`, cenários, `__kurioMock` |
| Relatório HTML e traces | `reporter: html`, `trace: 'retain-on-failure'` |
| Lighthouse ≥ metas, medianas, LCP/CLS/TBT | [LIGHTHOUSE.md](LIGHTHOUSE.md) |
