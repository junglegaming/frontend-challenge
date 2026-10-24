# Quickstart: Telas do Marketplace de NFTs (Mobile + Desktop)

## Pré-requisitos

- `pnpm install` executado.
- Nenhuma variável de ambiente extra — os mocks (MSW) sobem junto com o dev server.

## Rodar localmente

```bash
pnpm dev
```

Abra `http://localhost:5173` (ou a porta exibida pelo Vite). O worker MSW deve registrar as
requisições REST/Socket.IO simuladas (ver `src/mocks/browser.ts`); confirme no console do navegador
que não há avisos de handler não coberto.

## Cenários de validação manual (um por história de usuário do spec.md)

1. **Home/catálogo (US1)** — em `/`, aplique um facetos de coleção e uma faixa de preço; confirme que
   a grade filtra e a paginação volta para a página 1. Redimensione para 390 px e confirme que os
   mesmos filtros ficam acessíveis via busca/`Sheet` e a `Dock` aparece no rodapé.
2. **Autenticação (US2)** — clique em "Entrar" na navbar, submeta um login válido (ver
   `src/mocks/fixtures/users.ts` para credenciais de desenvolvimento) e confirme que a navbar passa a
   mostrar a sessão. Em seguida acesse `/account/wallets` deslogado e confirme o redirecionamento
   para `/login?redirect=/account/wallets`, retornando a `/account/wallets` após o login.
3. **Carrinho (US3)** — adicione um NFT ao carrinho a partir da Home, abra `/cart`, altere a
   quantidade de uma linha e confirme que subtotal/total mudam sem reload; aplique um cupom inválido
   e confirme o erro inline sem alteração dos totais.
4. **Checkout (US4)** — com carrinho não-vazio e sessão ativa, abra `/checkout`, tente submeter com um
   campo obrigatório vazio (deve bloquear) e depois complete todos os campos e confirme a compra.
5. **Confirmação de pedido (US5)** — após o passo anterior, confirme que `/orders/$orderId` mostra o
   recibo completo e o link para o explorador; acesse um `orderId` inexistente e confirme o estado de
   "não encontrado".
6. **Carteiras (US6)** — em `/account/wallets`, salve uma carteira principal, recarregue a página e
   confirme que os valores persistem; adicione uma carteira secundária marcando "Igual à carteira
   principal" e confirme que os campos são copiados.

## Testes automatizados

```bash
pnpm lint
pnpm typecheck
pnpm test:e2e            # Playwright, inclui regressão visual 390/768/1440
pnpm build
pnpm lighthouse          # auditoria de acessibilidade/performance
```

Os cenários de falha exigidos pela constituição (rede, 4xx/5xx, sessão expirada, cupom inválido,
preço alterado, timeout com recuperação idempotente) MUST estar cobertos pelas suítes em
`e2e/<página>` antes de considerar uma história de usuário concluída.
