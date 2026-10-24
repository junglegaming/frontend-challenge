# Domínio `ledger`

Moedas da Kurio no site: saldo, histórico, recarga e pagamento com moedas, servidos pelo back-end real `apps/api`
(Postgres no Neon, specs/010-api-production-backend) por meio do caminho same-origin `/backend`
(specs/011-web-coins-real-api). É o único domínio de moedas do site; o antigo `coins` (cliente do `server/` da 006)
foi removido, e o `server/` em si não mudou.

## Como a conexão funciona

```
browser --/backend/*--> MSW (dev/e2e, VITE_ENABLE_BACKEND_MOCKS=true)
                    --> Vite proxy (dev/preview)  --> apps/api local /api/*  (BACKEND_PROXY_TARGET)
                    --> vercel.json rewrite (prod) --> https://<api>.vercel.app/api/*
```

- O prefixo é `/backend` (`VITE_BACKEND_BASE_URL`), **não** `/api`: o MSW é dono de todo o `/api`.
- Mesma origem para o navegador, então não há CORS, e a CSP `connect-src 'self'` é respeitada.
- Quem responde ao `/backend` é decidido só por `VITE_ENABLE_BACKEND_MOCKS` (`true` em dev/e2e, `false` em produção).

## Autenticação

`apps/api` exige um token assinado por requisição. `api/client.ts` emite um token por usuário da sessão
(`POST /auth/token`), guarda em memória, renova ~30 s antes de expirar e refaz uma vez após `401`. Os tokens são
descartados quando o token de sessão do app muda (login/logout/troca de usuário), e o logout limpa o cache.

**Limitação conhecida (FR-016):** a emissão do token confia no `ownerId` informado, e a identidade do site é a sessão
simulada (`usr_…`). Qualquer pessoa consegue emitir um token para qualquer `ownerId`: as moedas do site publicado são
**de demonstração**. Ver `apps/api/README.md`.

## Códigos que importam

| Código | Significado | O cliente faz |
|---|---|---|
| `402` | saldo insuficiente | erro final (`LedgerError.isInsufficientBalance`), mensagem com saldo e custo |
| `409` | a `Idempotency-Key` já foi usada para **outra** operação | erro final (`isKeyConflict`), **nunca** repetido |
| `401` | token recusado | renova o token uma vez e repete |
| rede / timeout / `5xx` | falha transitória | as queries repetem no máximo 2 vezes; escritas não repetem sozinhas |

## Idempotência (toda escrita)

Toda escrita leva `Idempotency-Key` (a assinatura das funções exige a chave). Mesma chave + mesma operação ⇒ a API
devolve o resultado original sem novo efeito.

- **Recarga (Carteiras):** uma chave por intenção do usuário, mantida enquanto ele repete o mesmo valor (inclusive após
  um timeout) e trocada no sucesso ou quando o valor muda.
- **Checkout:** chaves derivadas da chave do pedido (`coinsKeys(orderKey)` ⇒ `:coins-debit` e `:coins-refund`).
  Pedido **recusado** (4xx) ⇒ crédito de volta com `:coins-refund` e a chave do pedido é rotacionada
  (`rotateIdempotencyKey`), para que a próxima tentativa debite de novo. Falha **ambígua** (rede, timeout, 5xx; o pedido
  pode existir) ⇒ nada é devolvido. Detalhes: `specs/011-web-coins-real-api/data-model.md`.

## API pública

`useLedgerBalance`, `useLedgerTransactions(limit)`, `useLedgerTopUp` (atualização otimista com rollback),
`ledgerDebit` / `ledgerCredit` / `invalidateLedger` (para o checkout), `ledgerKeys`, `coinsKeys`, `toCoinsAmount` e
`ETH_TO_COINS_RATE` (1 ETH = 1000 moedas, arredondando para cima), `ledgerErrorMessage` e `LedgerError`. Respostas são
validadas com Zod. Cache por usuário: `['ledger', 'balance', userId]` e `['ledger', 'transactions', userId, limit]`.

## Testes

O Playwright roda contra `src/mocks/contexts/ledger` (MSW), nunca contra o back-end real. O mock reproduz o contrato
da API, incluindo idempotência (replay, `409`, chave inválida `400`) e persistência em `localStorage` (o saldo sobrevive
a um reload). Cenários de falha: `coins-unavailable` (`503` em tudo) e `coins-response-lost` (a primeira escrita é
aplicada e a resposta se perde). Specs: `e2e/ledger`, `e2e/wallets/coins.spec.ts`, `e2e/checkout/coins.spec.ts` e, no
build de produção, `e2e/production/hardening.spec.ts`.
