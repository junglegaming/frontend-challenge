# Research: Moedas do site usando o back-end real

Sem `NEEDS CLARIFICATION` pendente: as três decisões de escopo (estorno, ambientes, rastreio na Spec Kit) foram tomadas
com o usuário no planejamento. Cada decisão abaixo responde a um requisito da spec.

## D1: Reaproveitar o domínio `ledger`, remover o domínio `coins`

**Decision**: as telas passam a usar `apps/web/src/domains/ledger` (feito na 007, com token por dono, renovação após 401,
hooks e mock). `src/domains/coins` e a configuração `VITE_COINS_API_URL`/`coinsEnabled` são removidos.

**Rationale**: o `ledger` já implementa o contrato do `apps/api`; o `coins` implementa o do `server/` (identidade por
`X-User-Id`, campo `balance`, 409 = saldo insuficiente, rota de estorno), que não existe no `apps/api`. Adaptar o `coins`
duplicaria o `ledger`. FR-013.

**Alternatives considered**: adaptar `coins` para o `apps/api` (duplicação, dois domínios de moedas); manter os dois com
um "seletor" de backend (complexidade sem usuário que precise do `server/` no site).

## D2: 409 deixa de ser repetido

**Decision**: remover o laço `CONFLICT_RETRIES` de `ledgerRequest`. Um 409 vira `LedgerError` com
`isKeyConflict = true` (código `idempotency_key_conflict`) e é final. As queries continuam repetindo só falhas
transitórias (`isRetryable`: rede, timeout, 5xx), como já fazem.

**Rationale**: desde a 007 T056/010 o `apps/api` só devolve 409 para chave reutilizada com outra operação; repetir não
muda o resultado e mascara um bug do chamador. FR-008.

## D3: Chave de idempotência em toda escrita

**Decision**: `ledgerRequest` aceita `idempotencyKey` e envia o cabeçalho `Idempotency-Key`. As escritas expostas exigem
a chave (tipo obrigatório), para que nenhum chamador esqueça:
- **Recarga (Carteiras)**: uma chave por **intenção** do usuário, criada com `crypto.randomUUID()` quando ele confirma e
  mantida até o sucesso (ou até ele mudar o valor). Assim, repetir após timeout reaplica a mesma chave (efeito único);
  uma nova recarga deliberada recebe chave nova.
- **Débito no checkout**: `${orderKey}:coins-debit`.
- **Crédito de volta**: `${orderKey}:coins-refund`.

`orderKey` é a chave do pedido já existente (`idempotencyKeyFor(quoteSignature)`, `domains/checkout/model/idempotency.ts`),
uma por assinatura de cotação, em memória da aba. Tamanho: UUID (36) + sufixo (≤ 13) < 128 (limite da API).

**Rationale**: FR-004/FR-005/FR-007, SC-002/SC-003. Derivar do pedido amarra débito e devolução ao mesmo pedido e torna
"no máximo uma devolução por pedido" uma propriedade do servidor, não do cliente.

**Alternatives considered**: chave nova por clique (quebra o efeito único em retry); chave em `localStorage` (sobrevive a
recarregar a página, mas mistura tentativas antigas de outra cotação; desnecessário para a spec).

## D4: Estorno = recarga com chave derivada (sem mudar a API)

**Decision** (revista após `/speckit-analyze`, achado U1): quando `createOrder` é **recusado de forma definitiva** (4xx)
depois do débito, o checkout chama a recarga com o mesmo valor e a chave `${orderKey}:coins-refund` e, se der certo,
rotaciona a chave do pedido daquela cotação (`rotateIdempotencyKey`), para que a próxima tentativa debite de novo em vez
de repetir o débito antigo sem cobrar. Numa falha **ambígua** (rede, tempo esgotado, 5xx) não há devolução: o pedido
pode existir, e a nova tentativa reusa as chaves (débito e pedido repetidos sem novo efeito). Se o crédito falhar, mostra mensagem explícita ("suas moedas ainda não voltaram…") e
oferece "tentar devolver de novo", que reaplica a mesma chave.

**Rationale**: decisão do usuário (FR-007, FR-014). O histórico mostra débito + crédito, o que é honesto e auditável.

**Alternatives considered**: rota de estorno na API (mudaria o contrato; outra feature); pedido antes do débito (exigiria
cancelar pedido no mock de pedidos).

## D5: Recarga com atualização otimista e rollback

**Decision**: `useLedgerTopUp` aplica `onMutate` (cancela a query de saldo, guarda o anterior, soma o valor), `onError`
restaura, `onSuccess` grava o saldo devolvido pela API, `onSettled` invalida o histórico.

**Rationale**: Princípio III exige ao menos uma interação otimista com rollback; a recarga é a candidata natural (efeito
previsível). O débito do checkout **não** é otimista (o resultado decide se o pedido é criado).

## D6: Moedas sempre ligadas; `VITE_ENABLE_BACKEND_MOCKS` escolhe mock ou real

**Decision**: remover `coinsEnabled`. As telas de moedas aparecem para quem está logado em todos os ambientes. Quem
responde ao `/backend` é decidido por `VITE_ENABLE_BACKEND_MOCKS` (já existente: `true` em dev/e2e, `false` em produção).

**Rationale**: FR-001, FR-012; o `/backend` é same-origin em todo ambiente (Vite proxy em dev/preview, `vercel.json` em
produção), então não há build sem backend.

## D7: Conversão ETH→moedas migra para o `ledger`

**Decision**: `ETH_TO_COINS_RATE = 1000` e `toCoinsAmount` (com `decimal.js`, arredonda para cima) passam para
`domains/ledger/model/conversion.ts`, exportados pela API pública do domínio.

**Rationale**: o checkout não pode importar um domínio removido; a regra é das moedas (spec, Assumptions).

## D8: Testes

**Decision**:
- **e2e com mocks** (`playwright.config.ts`): Carteiras (saldo 0, recarga, retry com mesma chave = um efeito, erro de
  serviço), Checkout (pagar com moedas, 402 antes de criar pedido, pedido falha → exatamente um crédito de volta,
  clique duplo = um débito), `e2e/ledger` (409 é final; mesma chave = replay). Falhas induzidas pelos controles do mock
  (`window.__nftMock`): o cenário `sold-out-at-checkout` faz o pedido falhar depois do débito; sem stub em componente.
- **e2e de produção** (`playwright.production.config.ts`): a tela de moedas **existe**; sem API local atrás do
  `/backend`, mostra o estado de indisponível; nenhuma chamada a `localhost`/porta 4000; todas as de moedas vão a
  `/backend`. Com `PLAYWRIGHT_BASE_URL` (site publicado), recarga real com dono dedicado.
- `check-production-bundle.mjs` continua barrando `localhost`; remove a menção a `VITE_COINS_API_URL`.

**Rationale**: SC-006/SC-007; Princípio VII.
