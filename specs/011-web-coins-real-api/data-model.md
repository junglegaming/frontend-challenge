# Data Model: Moedas do site usando o back-end real

O site não persiste moedas: o dono dos dados é o `apps/api` (ou o mock em dev/e2e). Abaixo estão as formas que o site
recebe, guarda em cache e envia. Os schemas já existem em `apps/web/src/domains/ledger/model/contracts.ts`
(validação Zod na borda, Princípio II); nenhum muda.

## Saldo (`LedgerBalance`)

| Campo | Tipo | Regra |
|---|---|---|
| `ownerId` | string | igual ao `user.id` da sessão do site |
| `amount` | inteiro ≥ 0 | o que a tela mostra ("N moedas") |
| `version` | inteiro ≥ 0 | +1 por operação aceita |
| `updatedAt` | ISO string | `1970-01-01T00:00:00.000Z` quando nunca houve operação |

Cache: `['ledger', 'balance', userId]`. Escrita aceita ⇒ `setQueryData` com o saldo devolvido.

## Operação (`LedgerTransaction`)

| Campo | Tipo | Regra |
|---|---|---|
| `txId` | string | id da operação |
| `direction` | `credit` \| `debit` | recarga e devolução são `credit`; pagamento é `debit` |
| `amount` | inteiro > 0 | |
| `resultingBalance` | inteiro ≥ 0 | |
| `createdAt` | ISO string | lista vem da mais recente para a mais antiga |

Cache: `['ledger', 'transactions', userId, limit]`; invalidado após cada escrita. Carteiras mostra as 5 mais recentes.

## Chave de operação (cliente)

| Uso | Valor | Vida |
|---|---|---|
| Recarga | `crypto.randomUUID()` | criada ao confirmar; reutilizada em nova tentativa do **mesmo** valor; descartada no sucesso ou se o valor mudar |
| Débito do checkout | `${orderKey}:coins-debit` | a da cotação atual; trocada quando a chave do pedido é rotacionada |
| Crédito de volta | `${orderKey}:coins-refund` | a da cotação atual |

`orderKey = idempotencyKeyFor(quoteSignature)` (existente); `rotateIdempotencyKey(quoteSignature)` (novo) troca a chave
daquela cotação depois de uma devolução bem-sucedida. Regras da API: 1..128 caracteres; mesma chave + mesma
operação ⇒ resultado original sem novo efeito; mesma chave + outra operação/valor ⇒ `409`.

## Conversão

`toCoinsAmount(totalEth) = ceil(totalEth × 1000)` (`decimal.js`), mesma função na tela ("custo desta compra") e na
cobrança.

## Erro (`LedgerError`)

| Situação | `status` | Propriedade | Mensagem ao usuário |
|---|---|---|---|
| Saldo insuficiente | 402 | `isInsufficientBalance` | "Saldo de moedas insuficiente: você tem X, esta compra custa Y." |
| Chave reutilizada com outro valor | 409 | `isKeyConflict` (novo) | "Esta operação já foi registrada com outro valor. Recarregue a página." |
| Rede, timeout, 5xx | `null`/≥500 | `isRetryable` | "Serviço de moedas indisponível. Tente novamente." |
| Credencial recusada após renovar | 401 | — | "Sua sessão de moedas expirou. Entre de novo." |
| Entrada inválida | 400 | — | mensagem da API |

## Estados do pagamento com moedas (checkout)

```text
confirmar ─► debitar (chave :coins-debit)
               ├─ 402 ─► "saldo insuficiente" (nada criado, nada descontado)                [fim]
               ├─ erro transitório ─► "tente de novo" (repetir usa as mesmas chaves)          [fim]
               └─ ok ─► criar pedido (chave do pedido)
                          ├─ ok ─► ir para o pedido                                          [fim]
                          ├─ recusa definitiva (4xx: esgotou, preço mudou, inválido)
                          │    ─► creditar de volta (chave :coins-refund)
                          │         ├─ ok ─► rotacionar a chave do pedido desta cotação;
                          │         │        "pedido não criado; moedas devolvidas"            [fim]
                          │         └─ falha ─► "moedas ainda não voltaram" + "devolver de novo"
                          │                    (mesma chave ⇒ no máximo uma devolução; a chave do
                          │                     pedido só é rotacionada quando a devolução dá certo)
                          └─ falha ambígua (rede, tempo esgotado, 5xx: o pedido pode existir)
                               ─► NÃO devolver; "Não confirmamos a compra. Confira seus pedidos antes de tentar de novo."
                                  (a nova tentativa reusa as chaves: débito e pedido são repetidos
                                   sem novo efeito, e o pedido existente é devolvido se já tiver sido criado)
```

Por que rotacionar: depois da devolução, a chave `:coins-debit` daquela cotação já foi "gasta". Se a próxima tentativa
reusasse a mesma chave do pedido, o débito seria **repetido sem cobrar** e o pedido sairia de graça. Por isso a próxima
tentativa recebe uma chave de pedido nova (`rotateIdempotencyKey(quoteSignature)` em
`domains/checkout/model/idempotency.ts`), e com ela chaves de débito e devolução novas.

## Mock (`src/mocks/contexts/ledger/service.ts`)

Ganha um mapa `(ownerId, idempotencyKey) → { direction, amount, resultado }`: replay devolve o resultado original; outra
direção/valor ⇒ `409 idempotency_key_conflict`; chave vazia ou > 128 ⇒ `400 invalid_idempotency_key`. `reset()` limpa o
mapa. Saldos, histórico e chaves são **persistidos no `localStorage`** pelo mesmo adaptador do resto do mock
(`src/mocks/infra/store.ts`), para sobreviver a `page.reload()`/navegação como o serviço real (FR-002, FR-011).
Cenários de falha do mock: `coins-unavailable` (todas as rotas, exceto `/health`, respondem `503`) e
`coins-response-lost` (a primeira escrita é **aplicada** e depois respondida com `503`; a repetição com a mesma chave
devolve o resultado original), usado para provar a recuperação idempotente após timeout (Princípio VII). Comportamento igual ao `apps/api` (`specs/010-api-production-backend/contracts/api-delta.md`).
