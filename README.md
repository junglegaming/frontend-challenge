# Kurio — Marketplace de NFTs

Implementação do desafio frontend ([enunciado](docs/CHALLENGE.md)): descoberta, compra e conta do colecionador, com backend REST e tempo real simulados por MSW.

- **Deploy:** https://kurio-nft-marketplace-one.vercel.app
- **Stack:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, Axios, Zod, React Hook Form, Tailwind CSS 4, shadcn/ui, MSW 2 + `@mswjs/socket.io-binding`, `socket.io-client`, Playwright, Lighthouse CI.

| Documento | Conteúdo |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Camadas, contratos REST, eventos Socket.IO, sessão, carrinho, checkout, cache e desvios do Figma, com diagramas |
| [docs/DECISIONS.md](docs/DECISIONS.md) | 21 decisões técnicas: contexto, alternativas descartadas e custo aceito |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Cada requisito do enunciado → código → teste que o comprova |
| [docs/BUGS.md](docs/BUGS.md) | Bugs encontrados na verificação, com causa raiz e correção |
| [docs/LIGHTHOUSE.md](docs/LIGHTHOUSE.md) | Medianas, LCP/CLS/TBT, ambiente e análise |

## Avaliação em 5 minutos

1. `npm ci && npm run dev` e abra `http://localhost:5173`.
2. **Catálogo:** filtre por coleção e rede, ordene, pagine, recarregue a página e use voltar. O estado vem da URL.
3. **Compra:** abra "Emerald Ape #042", clique em **Comprar**, aplique o cupom `KURIO10` e clique em **Conectar e finalizar**. Entre como `alice@kurio.dev` / `Kurio@123` (o carrinho do visitante é mantido), conecte a carteira, revise e confirme **duas vezes seguidas**: sai um único pedido, e o recibo chega via Socket.IO.
4. **Tempo real:** com o pagamento em revisão, abra o painel de cenários (frasco, canto inferior esquerdo) e use "Subir preço do 1º item". A cotação é descartada e uma nova revisão passa a ser obrigatória.
5. **Falhas:** no mesmo painel, escolha `order-timeout` e repita a compra. Em "Tentar novamente", o mesmo pedido é recuperado.
6. **Testes:** `npm run test:e2e` roda a suíte nos três viewports (desktop 1440, tablet 768, mobile 390) com o relatório HTML. `npm run test:e2e:docker` roda a mesma suíte em Linux, na imagem usada pela CI.

Na suíte E2E, os testes de tempo real passam pelo `socket.io-client` real e os de REST pelos handlers MSW. Nenhum teste injeta estado direto na UI ou no cache.

## Setup

Requisitos: Node 20.19+ e npm 10+.

```bash
npm ci
cp .env.example .env
npm run dev          # http://localhost:5173, já com os mocks ativos
```

### Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Backend simulado (REST + Socket.IO). Ligado sem `.env`; só `false` desliga |
| `VITE_API_URL` | `/api` | Base das chamadas REST (Axios) |
| `VITE_SOCKET_URL` | `wss://realtime.kurio.mock` | URL do Socket.IO (interceptada pelo MSW) |

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Desenvolvimento com mocks |
| `npm run build` | Gera rotas, verifica tipos e faz o build otimizado |
| `npm run preview` | Serve o build em `http://localhost:4173` |
| `npm run typecheck` | Verificação de tipos |
| `npm run lint` | Lint (oxlint) |
| `npm test` | Testes unitários da lógica crítica: aritmética ETH e regras de domínio do mock |
| `npm run test:e2e` | Playwright: 38 testes em Chromium, desktop 1440, tablet 768 e mobile 390 (inclui regressão visual) |
| `npm run test:e2e:update` | Atualiza as baselines de regressão visual (macOS) |
| `npm run test:e2e:docker` | A mesma suíte em Linux, na imagem `mcr.microsoft.com/playwright:v1.64.1-noble` (igual à CI) |
| `npm run test:e2e:docker:update` | Atualiza as baselines `-linux.png` usadas na CI |
| `npm run lighthouse` | Auditoria Lighthouse (desktop e mobile, 3 execuções) |

Relatório do Playwright: `npx playwright show-report` (traces das falhas incluídos).

**CI** (`.github/workflows/ci.yml`): typecheck, lint, unitários e build; E2E na imagem Docker do Playwright; Lighthouse. Relatórios saem como artefatos do workflow.

## Credenciais fictícias

| Usuário | E-mail | Senha | Observação |
| --- | --- | --- | --- |
| Alice | `alice@kurio.dev` | `Kurio@123` | Carteiras principal (MetaMask/Ethereum) e secundária (Coinbase/Polygon) |
| Bob | `bob@kurio.dev` | `Kurio@123` | Sem carteiras: o checkout leva ao cadastro de carteira |

Cupons: `KURIO10` (10% de desconto) e `EXPIRADO` (expirado). Qualquer outro código é inválido.

As senhas ficam no mock apenas como hash SHA-256 com salt.

## Cenários e reset

Selecione um cenário pela URL (fica salvo até ser trocado) ou pelo **painel de cenários**, o botão de frasco no canto inferior esquerdo:

```
http://localhost:5173/?scenario=price-change
```

| Cenário | Efeito |
| --- | --- |
| `default` | Latência de 150–400 ms |
| `empty` | Catálogo vazio |
| `slow` | Latência de 1,5–3 s (skeletons visíveis) |
| `out-of-order` | Buscas consecutivas respondem fora de ordem |
| `offline` | Todas as requisições falham por rede |
| `server-error` | Catálogo responde 503 nas 3 primeiras tentativas |
| `session-expired` | Sessão expira 20 s após o login |
| `favorite-fail` | Favoritar/desfavoritar falha (rollback otimista) |
| `price-change` | Preço do 1º item do carrinho sobe 3 s após abrir carrinho/checkout |
| `sold-out` | Edição do 1º item do carrinho esgota 3 s após abrir carrinho/checkout |
| `order-timeout` | O pedido é criado, mas a resposta chega depois do timeout do cliente |
| `payment-rejected` | Pagamento termina recusado |
| `wallet-rejected` | A carteira recusa a conexão |

**Reset:** botão "Resetar dados" no painel, ou `window.__kurioMock.reset()` no console. Restaura o seed determinístico (catálogo, usuários, carteiras) e limpa sessão, carrinho, favoritos e pedidos.

## Reproduzindo os fluxos de falha

- **Preço alterado no checkout:** entre como Alice, adicione um NFT, abra o carrinho com `?scenario=price-change` (ou use "Subir preço do 1º item" no painel) e confirme a compra. O resumo é atualizado e a confirmação exige revisar a nova cotação.
- **Timeout com recuperação:** `?scenario=order-timeout`, confirme a compra, aguarde a mensagem de timeout e clique em "Tentar novamente". O mesmo pedido é recuperado (mesma `Idempotency-Key`), sem compra duplicada.
- **Pagamento recusado:** `?scenario=payment-rejected`. O pedido termina recusado e os itens continuam no carrinho.
- **Queda de conexão com pedido pendente:** confirme uma compra e use "Derrubar conexão do socket" no painel (ou recarregue a página). O estado do pedido é recuperado sem nova compra.
- **Eventos duplicados ou antigos:** no painel, "Reenviar último evento" e "Enviar evento antigo". A interface não regride.
- **Sessão expirada:** "Expirar sessão" no painel durante o checkout. Você volta ao login e retoma o pagamento com o formulário preservado.

## Deploy

Vercel com o preset Vite. `vercel.json` reescreve todas as rotas para `index.html` (acesso direto e refresh). Não precisa de variáveis: os mocks ficam ativos por padrão.
