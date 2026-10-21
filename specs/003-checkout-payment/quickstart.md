# Quickstart: validar a Página de Pagamento

## Pré-requisitos

```bash
pnpm install
cp .env.example .env      # VITE_ENABLE_MOCKS=true
pnpm dev                  # http://localhost:5173
```

Crie uma conta em `/signup` (ex.: senha `Senha1234`, como nos testes) ou use um usuário de
`src/mocks/fixtures/users.ts`. O cenário de mock é escolhido pela URL (`?scenario=<id>`, persiste no
navegador) ou pelo console com `window.__nftMock.scenario`; `window.__nftMock.reset()` restaura o estado
inicial. Ids dos cenários: `src/mocks/scenarios/definitions.ts`.

## Roteiro manual

| # | Cenário | Passos | Esperado |
|---|---|---|---|
| 1 | `default` | Adicionar NFT ao carrinho → `/checkout` | Nome/e-mail pré-preenchidos; resumo com skeleton e depois valores |
| 2 | `default` | Escolher rede e carteira → "Conectar" → "Revisar pedido" → "Confirmar compra" | "Processando pagamento" → recibo em `/orders/<id>`; item saiu do carrinho |
| 3 | `wallet-rejected` | "Conectar" | "A conexão foi recusada na carteira." + "Tentar novamente"; não avança |
| 4 | `default` | Conectar → "Desconectar" | Ação principal bloqueada até reconectar |
| 5 | `price-change-at-checkout` | Revisar → Confirmar | Nenhum pedido; preço antigo → novo e total novo; exige nova confirmação |
| 6 | `sold-out-at-checkout` | Revisar → Confirmar | Item esgotado indicado; confirmação bloqueada; link para o carrinho |
| 7 | `order-timeout` | Confirmar e aguardar ~8 s → "Tentar novamente" | Mensagem de timeout; retry recupera o **mesmo** pedido |
| 8 | `payment-declined` | Confirmar | "Pagamento recusado" com motivo; itens continuam no carrinho; "Tentar novamente" volta ao formulário |
| 9 | `default` | Confirmar e recarregar durante "Processando" | Volta em "Processando" com o mesmo pedido |
| 10 | `short-session` | Preencher, esperar 30 s, Revisar | Aviso de sessão → login → volta a `/checkout` com dados preenchidos |
| 11 | `realtime-offline` | Fluxo completo | Funciona; revalidação no envio continua obrigatória |

## Verificações automáticas

```bash
pnpm typecheck
pnpm lint
pnpm check:tokens
pnpm test:e2e e2e/checkout          # fluxos da página
pnpm test:e2e:update e2e/checkout   # só ao aceitar mudança visual intencional
```

Contrato da tela: [contracts/checkout-page.md](./contracts/checkout-page.md) · Estados:
[data-model.md](./data-model.md).
