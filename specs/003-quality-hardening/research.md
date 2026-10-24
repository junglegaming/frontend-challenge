# Research: Quality Hardening — Failure Coverage, Rollback Test, A11y/UX Audit

## D1 — Como exercitar cada cenário de falha nos testes novos

**Decisão**: usar o controle já existente `window.__nftMock.scenario.select(<id>)` (exposto por
`src/mocks/devtools.ts`, já usado em `e2e/design-system/helpers.ts` via `selectScenario`) para
selecionar, por teste: `price-change-at-checkout` (US1 cenário 1), `short-session` (US1 cenário 2),
e um de `server-error`/`service-unavailable`/`offline` (US1 cenário 3) no catálogo/carrinho.

**Razão**: esses cenários já existem em `src/mocks/scenarios/definitions.ts`; o gap é só não serem
exercitados, não a ausência de infraestrutura de mock (Princípio V já satisfeito).

**Nota sobre `short-session`**: o cenário define `sessionTtlMs: 30_000`; para um teste e2e rápido,
usar `page.clock` do Playwright (ou aguardar efetivamente os 30 s uma única vez, já que é o teste
mais barato de tornar determinístico) para avançar o tempo além do TTL antes de disparar uma ação
autenticada, e então afirmar o redirecionamento para `/login?redirect=...` (reaproveita o guard de
`requireSession`/`beforeLoad` já existente — nenhuma mudança de código esperada aqui, só o teste).

**Nota sobre `price-change-at-checkout`**: o cenário aplica `checkoutMutation: 'price_change'` no
primeiro item antes da primeira validação do pedido (ver `OrderPolicy.beforeValidation` no mock).
O fluxo de `CheckoutPage.onSubmit` já revalida a cotação (`quote.refetch()`) e já compara
`fresh.data.signature !== quote.data.signature` antes de confirmar — o comportamento esperado
(bloquear e avisar) já deveria existir; este teste é o que falta para prová-lo, não uma lacuna de
código conhecida. **Se o teste revelar que o aviso não aparece**, isso vira um defeito real a
corrigir (ver spec.md, Edge Cases).

## D2 — Triagem dos 25 itens de `specs/002-nft-marketplace-screens/checklists/ux-a11y-review.md`

Cada item recebe uma resolução: **CODE** (pequena correção de implementação), **SPEC** (ajuste de
texto em `specs/002-nft-marketplace-screens/spec.md`), ou **RATIONALE** (nenhuma mudança — o item já
está satisfeito por algo existente, registrado como nota no próprio checklist).

| CHK | Resolução | Nota |
|---|---|---|
| CHK001 | SPEC | Adicionar uma frase em FR-001 remetendo à nota de Assumptions sobre diferenças aceitáveis. |
| CHK002 | RATIONALE | O badge "Raro" já é condicionado a `nft.featured` (os 3 primeiros NFTs por fixture); documentar essa regra no checklist. |
| CHK003 | **CODE** | `CartPage`, `CheckoutPage` e `WalletsPage` tratam `isPending`/sucesso mas não `isError` da query principal — só o catálogo e a confirmação de pedido têm estado de erro explícito hoje. Adicionar um estado de erro com ação de retry nos três. |
| CHK004 | SPEC | Reescrever FR-022 para permitir explicitamente tratamentos visuais diferentes (sidebar vs. sheet) desde que a função seja equivalente. |
| CHK005 | RATIONALE | Hover/focus já implementados via classes Tailwind (`group-hover`, `group-focus-within`) em `NftCard`. |
| CHK006 | RATIONALE | O `Dialog` do shadcn já usa `max-w-[calc(100%-2rem)]`, cabendo em 390 px sem precisar de uma variante `Sheet` separada; nenhuma mudança necessária. |
| CHK007 | RATIONALE | O controle de ordenação rápida (`SortBar`) já usa `aria-pressed` + variante de botão diferente para o item ativo. |
| CHK008 | RATIONALE | Atualização de preço/disponibilidade em tempo real é só uma re-renderização do valor (sem transição); tratado como polish fora de escopo — comportamento de dados já correto (Princípio IV). |
| CHK009 | **CODE** (teste) | `Slider`/`RadioGroup`/`Checkbox` são primitivas Radix com suporte a teclado nativo; adicionar uma asserção e2e de navegação por teclado no filtro de preço (`CatalogFilters`) para prová-lo, em vez de apenas confiar na biblioteca. |
| CHK010 | **CODE** | `CartSummary` já tem `aria-live="polite"` nos totais; `OrderSummary` (checkout) não tem — adicionar para manter paridade. |
| CHK011 | RATIONALE | O `Dialog` do Radix já faz *focus trap* automaticamente; como o diálogo de auth não tem um "trigger" (é a própria rota), não há foco de retorno aplicável — comportamento já correto. |
| CHK012 | RATIONALE | `QuantityStepper` já recebe `itemName` e gera `aria-label` distinto por linha; botão de remover já inclui o nome do item. |
| CHK013 | RATIONALE | `PendingState` usa `role="status"` e `DeclinedState` usa `role="alert"` — ambos já anunciados a tecnologia assistiva por padrão do navegador. |
| CHK014 | RATIONALE | `STATUS_MESSAGE` em `CartLineList` já renderiza texto (não só cor) para cada status de linha. |
| CHK015 | RATIONALE | `AccountSideMenu`/`SideMenu` reaproveita o componente já auditado pela suíte de acessibilidade da feature 001 (`e2e/design-system/responsive.spec.ts`, "profile: no horizontal scroll and correct navigation chrome"). |
| CHK016 | SPEC | Adicionar uma nota em Key Entities do `spec.md` da 002 remetendo à resolução já registrada em `research.md` D2/D3 daquela feature. |
| CHK017 | RATIONALE | O conjunto exato de campos já está na tabela de `contracts/checkout.md` da 002; `spec.md` intencionalmente fica no nível de "o quê", não repete a tabela. |
| CHK018 | SPEC | Adicionar uma frase em FR-015 remetendo à definição precisa do escopo da chave em `research.md` D4 da 002 (atrelada à assinatura da cotação). |
| CHK019 | SPEC | Completar FR-012 com o destino concreto do redirecionamento (`/cart`), já implementado em `CheckoutPage`. |
| CHK020 | RATIONALE | O mapeamento de explorador por rede já existe no mock (`EXPLORERS` em `orders/service.ts`); não é ambíguo na prática, só não repetido no spec. |
| CHK021 | RATIONALE | FR-011 intencionalmente define apenas sucesso/falha da aplicação do cupom, sem exigir 3 mensagens distintas por motivo; escopo deliberadamente simples, não uma lacuna. |
| CHK022 | SPEC | Completar FR-020 afirmando que a cópia é um snapshot no momento da criação, não um vínculo ao vivo (comportamento já implementado assim). |
| CHK023 | RATIONALE | Já coberto genericamente pela revalidação do FR-015 antes de confirmar, que se aplica independentemente da causa da mudança (outra aba, outro dispositivo, etc.). |
| CHK024 | SPEC | Adicionar uma nota curta de rastreabilidade por Success Criterion remetendo ao(s) FR(s) que o sustentam. |
| CHK025 | SPEC | Adicionar uma tabela curta de rastreabilidade User Story → FR(s) ao final do `spec.md` da 002. |

**Resultado da triagem**: 3 itens exigem correção de código (CHK003, CHK009, CHK010), 8 exigem apenas
ajuste de texto no `spec.md` da 002 (CHK001, CHK004, CHK016, CHK018, CHK019, CHK022, CHK024, CHK025),
e 14 já estão satisfeitos pelo comportamento/código existente, só precisando da nota de justificativa
no checklist (os demais).

## D3 — Onde registrar cada resolução

**Decisão**: os itens **RATIONALE** recebem uma nota inline no próprio
`specs/002-nft-marketplace-screens/checklists/ux-a11y-review.md` (marcando `[x]` com uma frase),
sem reabrir `spec.md`. Os itens **SPEC** editam `specs/002-nft-marketplace-screens/spec.md`
diretamente (pequenos ajustes de texto, não mudam comportamento). Os itens **CODE** alteram o código
de produção listado na Project Structure do `plan.md` e ganham cobertura de teste nova ou estendida.

**Razão**: mantém a 002 como a fonte de verdade de requisitos (em vez de duplicar texto nesta
feature), evita reabrir seu `tasks.md` já concluído (62/62), e deixa claro, por tipo de resolução,
qual artefato muda.
