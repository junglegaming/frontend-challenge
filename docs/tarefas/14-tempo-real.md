# 14 — Tempo real: integração Socket.IO na UI

**Onda:** 8 · **Paralela com:** `15-a11y-responsivo` · **Depende de:** 11, 12 · **Bloqueia:** 16, 18
**Label sugerido:** `ui` · **Esforço:** M

## Objetivo

Integrar os eventos `nft.updated` e `order.updated` à interface pelas regras de
`ARCHITECTURE.md` §5 — dedupe, escopo de sessão e reconciliação REST.

## Subtasks

### 14.1 — Provider e ciclo de vida

- `lib/socket`: provider singleton no root; assinaturas em `useEffect` com cleanup
  total (`off`/`removeListener`) — nenhum listener órfão

### 14.2 — Dedupe e ordem por versão

- Aplicar só se `version > última conhecida`; duplicatas e eventos antigos ignorados
  sem efeitos (log em dev)

### 14.3 — `nft.updated` na UI

- `setQueryData` no detalhe + merge nas listas visíveis + aviso no carrinho —
  revisar a implementação do 11 sob as regras de versão

### 14.4 — `order.updated` com escopo de sessão

- Atualizar pedido **apenas** se pertencer ao usuário atual; estados terminais são
  definitivos (nunca voltam a `pending`)

### 14.5 — Reconciliação na reconexão

- No `connect`: refetch REST dos recursos ativos (carrinho, cotação, catálogo visível,
  pedido pendente) — reconexão não cria nem duplica pedidos

### 14.6 — Cenários obrigatórios

- Preço muda durante checkout → aviso → `QUOTE_STALE` → bloqueio até nova confirmação
- Queda com pedido pendente + refresh/reconexão → recupera sem nova compra

### 14.7 — Feedback acessível

- `aria-live`/`role="status"` para eventos que alteram valores visíveis

## Critérios de aceite (gate)

- [x] Evento de outro usuário (emitido via `_mock/emit`) **não** altera a UI
- [x] `pnpm typecheck && pnpm lint && pnpm test:contract` verdes

## Implementação e validação

- Provider singleton no root com cleanup dos listeners e verificação da sessão
  antes de aplicar eventos ou reconciliar recursos ativos por REST.
- Cache de NFT/pedido preserva versões crescentes e snapshots terminais; descartes
  têm log em desenvolvimento. Eventos privados exigem a query key do usuário atual.
- Avisos acessíveis no provider e dentro do diálogo de autorização quando a cotação
  muda; autorização bloqueada até revisão explícita dos novos valores.
- Contrato em `tests/contract/socket.spec.ts`; cenários E2E de isolamento, listeners,
  reconexão sem POST adicional, cotação obsoleta e preço durante autorização em
  `tests/e2e/checkout.spec.ts`, além dos cenários de versão em carrinho/detalhe.
- Os cenários de compra usam foco + Enter. A execução por clique no mobile revelou
  sobreposição de elementos do formulário sobre o botão de compra; revisar esse
  layout na tarefa 15. A validação por teclado não cobre esse problema de ponteiro.
- Verificação: typecheck/lint e 54 testes de contrato verdes; 18 cenários de tempo
  real em desktop/mobile validados entre a rodada principal e as repetições dos
  testes de relógio/revisão. A suíte ampla de checkout também revelou expectativas
  antigas de título e alerta/saída na recusa, fora dos cenários desta tarefa.

## Referências

- `ARCHITECTURE.md` §5 · `docs/MOCKS.md` §6 · `docs/api/orders.md` §Fluxo
