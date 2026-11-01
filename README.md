# Kurio — Marketplace de NFTs

Marketplace de NFTs em **React + TypeScript**, fiel ao Figma do desafio da Jungle
Gaming. Fluxos de **descoberta, compra e conta do colecionador** em desktop e
mobile. Toda a API REST e o tempo real (**Socket.IO**) são simulados no
navegador com **MSW** — inclusive no build publicado.

## Stack

| Responsabilidade      | Tecnologia                             |
| --------------------- | -------------------------------------- |
| Interface / linguagem | React 19 + TypeScript (strict)         |
| Build                 | Vite                                   |
| Roteamento            | TanStack Router (search params na URL) |
| Estado remoto         | TanStack Query                         |
| HTTP                  | Axios                                  |
| Tempo real            | socket.io-client                       |
| Estilo / componentes  | Tailwind CSS 4 + shadcn/ui             |
| Mocking               | MSW + `@mswjs/socket.io-binding`       |
| Testes                | Vitest (unit) + Playwright (E2E)       |
| Auditoria             | Lighthouse (LHCI)                      |

## Requisitos

- **Node.js 22+** (ver `.nvmrc`)
- **npm 10+**

## Como rodar

```bash
npm ci
npm run dev          # http://localhost:5173
```

Build de produção local:

```bash
npm run build
npm run preview      # http://localhost:4173
```

## Variáveis de ambiente

Copie `.env.example` para `.env` (os padrões já funcionam):

| Variável            | Padrão                      | Para que serve                                          |
| ------------------- | --------------------------- | ------------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | `true`                      | Liga o MSW (REST + Socket.IO). Também no build de demo. |
| `VITE_API_URL`      | `/api`                      | Base do REST (interceptado pelo MSW).                   |
| `VITE_SOCKET_URL`   | `wss://realtime.kurio.test` | Host fictício do Socket.IO (interceptado pelo MSW).     |

## Credenciais e dados fictícios

| Usuário                                      | E-mail             | Senha      |
| -------------------------------------------- | ------------------ | ---------- |
| Nova Sato (2 carteiras: Principal e Reserva) | `nova@kurio.test`  | `kurio123` |
| Bruno Lima (sem carteiras)                   | `bruno@kurio.test` | `kurio123` |

Cupons: `KURIO10` (10%), `LANCAMENTO5` (5%), `EXPIRADO20` (expirado). Qualquer
outro é inválido. Para cadastrar carteiras use endereços completos (`0x` + 40
hexadecimais).

## Cenários do backend simulado

`?scenario=<nome>` na URL aplica o cenário ao carregar; `?reset=1` restaura o
seed. No console, `window.__kurio` expõe a mesma API usada pelos testes:
`applyScenario(nome)`, `reset()`, `emitNftUpdated(...)`, `emitOrderUpdated(...)`
e `dropRealtimeConnections()`. Cada chamada parte do estado padrão (cenários não
se acumulam).

| Cenário               | Efeito                                                                      |
| --------------------- | --------------------------------------------------------------------------- |
| `default`             | estado estável, sem atraso                                                  |
| `empty`               | catálogo vazio                                                              |
| `slow`                | latência de 2,5 s nas respostas                                             |
| `latency`             | latência variável (1,2 s / 0,15 s / 0,6 s / 0,3 s): respostas fora de ordem |
| `offline`             | falha de conexão (erro de rede)                                             |
| `server_error`        | respostas 503                                                               |
| `price_changed`       | o Emerald Ape #042 passa a 2.99 ETH (REST + `nft.updated`)                  |
| `sold_out`            | as edições do Emerald Ape #042 esgotam (REST + `nft.updated`)               |
| `session_expired`     | expira as sessões ativas                                                    |
| `order_timeout`       | o pedido é criado, mas a resposta chega depois do timeout do cliente        |
| `payment_declined`    | o próximo pedido é recusado                                                 |
| `favorite_error`      | incluir/remover favorito falha (503)                                        |
| `wallet_rejected`     | a carteira recusa a conexão                                                 |
| `wallet_disconnected` | encerra as conexões de carteira ativas                                      |

Reset completo: `/?reset=1` ou `window.__kurio.reset()`.

## Comandos

```bash
npm run dev          # desenvolvimento com mocks
npm run build        # build de produção
npm run preview      # servir o build
npm run typecheck    # TypeScript strict
npm run lint         # ESLint
npm run format:check # Prettier
npm run test:unit    # Vitest
npm run test:e2e     # Playwright (Chromium desktop + mobile), relatório HTML e traces
npm run lighthouse   # build + Lighthouse mobile e desktop (3 execuções) + resumo
```

## Como reproduzir as falhas

Entre com `nova@kurio.test` quando o fluxo exigir sessão.

| Situação                                         | Passo a passo                                                                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Preço muda durante o checkout**                | Item no carrinho → `/pagamento` → conecte a carteira → `__kurio.applyScenario('price_changed')`. Aparece o aviso, o total muda e a confirmação exige aceite. |
| **Edição esgota durante a compra**               | Igual ao anterior com `sold_out`: a confirmação fica bloqueada.                                                                                              |
| **Carrinho aberto recebe alteração**             | Em `/carrinho`, `applyScenario('price_changed')`: "Preço atualizado (era 1.19 ETH)" e resumo novo.                                                           |
| **Timeout com recuperação**                      | No checkout, `applyScenario('order_timeout')` e confirme: após ~10 s o cliente reenvia a mesma tentativa e abre o mesmo pedido.                              |
| **Cliques repetidos**                            | Clique várias vezes em "Confirmar e pagar": um único pedido.                                                                                                 |
| **Pagamento recusado**                           | `applyScenario('payment_declined')` antes de confirmar: recibo de recusa e itens mantidos no carrinho.                                                       |
| **Carteira recusa / desconecta**                 | `wallet_rejected` antes de conectar; `wallet_disconnected` depois de conectar e antes de confirmar.                                                          |
| **Sessão expirada**                              | Em `/carteiras` ou `/pagamento`, `applyScenario('session_expired')` e recarregue (ou clique em algo): login com retorno à página.                            |
| **Queda do tempo real**                          | Com um pedido pendente, `__kurio.dropRealtimeConnections()`: o socket reconecta e o estado é reconciliado.                                                   |
| **Eventos duplicados/antigos**                   | `__kurio.emitNftUpdated({ nftId: 'nft-1', version: 50, priceEth: '1.19' })` duas vezes: um aviso só.                                                         |
| **Favorito falha**                               | `applyScenario('favorite_error')` e favorite: aviso e estado restaurado.                                                                                     |
| **Cupom inválido/expirado**                      | No carrinho, aplique `XYZ` ou `EXPIRADO20`.                                                                                                                  |
| **Carregamento lento / respostas fora de ordem** | `/?scenario=slow` (skeleton) e `/?scenario=latency` trocando filtros rapidamente.                                                                            |
| **Falha de conexão / servidor**                  | `/?scenario=offline` ou `/?scenario=server_error` → "Tentar novamente" depois de voltar ao `default`.                                                        |
| **Carrinho preservado no login**                 | Adicione um item como visitante e faça login.                                                                                                                |
| **Dados isolados por usuário**                   | Compre como Nova, saia, entre como Bruno e abra a URL do pedido: "Pedido não encontrado".                                                                    |

## Performance (Lighthouse)

`npm run lighthouse` audita **início** e **detalhe do NFT** com o build de
produção e o cenário padrão dos mocks (imagens, fontes, MSW e tempo real
ativos, sem simplificações). Configuração versionada em `lighthouserc.json`
(mobile) e `lighthouserc.desktop.json` (desktop); relatórios HTML/JSON da
execução representativa e o resumo das medianas em [`lighthouse/`](./lighthouse).

Mediana de 3 execuções por página e perfil (Lighthouse 12.6.1, Chromium 156
headless, Node 22, Linux; mobile com throttling simulado: 150 ms RTT,
1,6 Mbps, CPU 4×; desktop: 40 ms RTT, 10 Mbps, sem redução de CPU):

| Perfil  | Página       | Performance | Accessibility | Best Practices | SEO |    LCP | CLS |    TBT |
| ------- | ------------ | ----------: | ------------: | -------------: | --: | -----: | --: | -----: |
| mobile  | `/`          |          91 |            97 |            100 |  92 | 2,94 s |   0 | 194 ms |
| mobile  | `/nft/nft-1` |      **89** |           100 |            100 |  92 | 3,06 s |   0 | 199 ms |
| desktop | `/`          |         100 |            97 |            100 |  92 | 0,77 s |   0 |   0 ms |
| desktop | `/nft/nft-1` |         100 |           100 |            100 |  92 | 0,79 s |   0 |   0 ms |

**Abaixo da meta:** Performance mobile do detalhe (89, meta 90). Causa: o
backend é o próprio navegador. Antes da primeira pintura, o app precisa baixar
e iniciar o MSW (~164 KB gzip, Service Worker e interceptadores) e só então
carregar o app — uma cascata que um backend real não teria. No detalhe, a arte
(LCP) depende ainda da resposta da API simulada. Já aplicados: artes em WebP
(−94% de bytes), split por rota, zod fora do chunk de entrada, prioridade na
imagem de LCP e cache imutável dos assets. Detalhes e medições em
`docs/13-PERFORMANCE.md`.

> O Lighthouse não enxerga os bytes que passam pelo Service Worker do MSW, então
> o LCP simulado pode ser otimista em redes muito lentas.

## Documentação técnica

- Contratos REST, eventos e decisões de arquitetura: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Justificativas, trade-offs e uso de IA: [`DECISOES.md`](./DECISOES.md)

## Deploy

- **Produção:** https://frontend-challenge-beta.vercel.app
- **Repositório:** https://github.com/gabriellqv/frontend-challenge
- **Plataforma:** Vercel (build Vite), com MSW e tempo real ativos no build publicado.

Validado em produção: acesso direto às rotas, refresh, 404, login, carrinho,
evento `nft.updated` e compra completa até o recibo confirmado.
