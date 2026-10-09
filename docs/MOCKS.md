# Mocks, Cenários, Tempo Real e Testes

A camada de mocks é a **única** fonte de dados falsos: intercepta Axios (REST) **e** o
Socket.IO no ponto de rede. Componentes, hooks e o cliente Axios não contêm respostas
fictícias nem ramos de negócio alternativos (exigência do enunciado).

## 1. Ativação

| Contexto              | Como liga                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Desenvolvimento       | `pnpm dev` → `VITE_MOCKS=true` (default) sobe o MSW worker no bootstrap de `main.tsx`         |
| Build de demonstração | `VITE_MOCKS=true pnpm build` — mocks presentes no bundle publicado                            |
| Playwright            | `use: { VITE_MOCKS: 'true' }` via env do config (worker inicia no `page.goto`)                |
| Produção "sem mocks"  | `VITE_MOCKS=false` → app aponta para `VITE_API_BASE_URL` real (fora do escopo, mas suportado) |

`src/mocks/` só é importado dinamicamente quando a flag está ativa (`import(/* webpackIgnore */ …)`
via `if (import.meta.env.VITE_MOCKS)`), garantindo tree-shaking no build sem mocks.

## 2. Persistência e reset

| Chave `localStorage` | Conteúdo                                                                   |
| -------------------- | -------------------------------------------------------------------------- |
| `gm_db_v1`           | database completo (nfts, users, cart, favorites, wallets, orders, coupons) |
| `gm_session`         | sessão (não é DB, mas sobrevive a refresh)                                 |
| `gm_anon_id`         | uuid do visitante                                                          |
| `gm_pending_order`   | chave/id de idempotência em andamento                                      |
| `gm_scenario`        | cenário ativo (quando selecionado por URL/UI)                              |

- **Persistência local permitida** para sustentar refresh — o DB é hidratado do
  `localStorage` no boot do worker e sincronizado a cada mutação.
- **Reset** restaura integralmente o seed conhecido:
  - `?reset=1` na URL (apagado após o boot);
  - `POST /api/_mock/reset` (usado por Playwright `beforeEach`);
  - botão "Reset cenário" no switcher dev.
- Seed é **determinístico**: ids, preços, datas e contagens fixos (nada de aleatoriedade
  não-semeada).

## 3. Seleção de cenários

Ordem de precedência: `?scenario=<id>` → `POST /api/_mock/scenario` (switcher/teste) →
`localStorage gm_scenario` → `VITE_MOCK_SCENARIO` → `padrao`.

- `?scenario=` grava em `gm_scenario` e recarrega (link compartilhável de demonstração).
- Switcher flutuante (cenário + status de rede + botão reset) aparece apenas em dev
  (`import.meta.env.DEV`) ou com `VITE_MOCK_UI=1`.
- Playwright injeta via `page.addInitScript` (grava `gm_scenario` antes do app boot),
  garantindo isolamento por teste.

## 4. Cenários determinísticos

| id                     | O que simula                       | Gatilho/ comportamento                                                                                                              |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `padrao`               | sucesso                            | latência 150–400 ms (fixa por recurso)                                                                                              |
| `vazio`                | resultado vazio                    | `GET /nfts` → `items: []` com `total: 0`                                                                                            |
| `lento`                | carregamento longo                 | latência 3000 ms → skeletons visíveis                                                                                               |
| `latencia-varia`       | latência variável + fora de ordem  | 200–2500 ms semeada por requisição; listagem de páginas responde fora de ordem (cliente deve descartar obsoletas)                   |
| `offline`              | indisponibilidade de conexão       | MSW responde com erro de rede (`error`) em todos os endpoints                                                                       |
| `erro-5xx`             | falha HTTP                         | `500 INTERNAL` no catálogo/detalhe; demais 200                                                                                      |
| `erro-4xx`             | erro de recurso                    | `404` em todo `GET /nfts/:id` (testa detalhe inexistente)                                                                           |
| `sessao-expirada`      | sessão expirada                    | tokens expiram imediatamente após login → `401 SESSION_EXPIRED` em rotas privadas e no checkout                                     |
| `nao-autorizado`       | acesso não autorizado              | `403 FORBIDDEN` em `GET /orders/:id` de outro usuário                                                                               |
| `cadastro-conflito`    | conflito de cadastro               | signup com `ana@nft-marketplace.test` → `409 CONFLICT`                                                                                    |
| `validacao-api`        | erro de validação remoto           | `422` com `fields` em todos os POSTs de formulário (perfil/senha/carteiras)                                                         |
| `cupom-ruim`           | cupom inválido/expirado            | códigos válidos também → `422 COUPON_INVALID`; `FAKE` → `422 COUPON_INVALID`; `EXPIRED` → `410 COUPON_EXPIRED` (também no `padrao`) |
| `preco-muda`           | preço/edição muda durante a compra | 6 s após abrir `/checkout` com `golden-signal-160` no carrinho: `nft.updated` (price e available) + `QUOTE_STALE` no envio          |
| `estoque-esgotado`     | edição esgotada                    | `409 INSUFFICIENT_STOCK` ao confirmar (disponibilidade do item cai para 0)                                                          |
| `timeout-pedido`       | timeout após criação               | `POST /orders` só responde após 15 s → cliente sofre timeout; reenvio com a MESMA chave recupera o mesmo pedido                     |
| `pagamento-confirmado` | aprovação                          | `status: confirmed` + `txHash`/`explorerUrl` simulados após 2–4 s                                                                   |
| `pagamento-recusado`   | recusa                             | `status: declined` + `declineReason` após 2–4 s                                                                                     |

O catálogo inclui ainda `socket-queda` (18º cenário): desconexão após 1500 ms e reconexão pelo cliente real. Cenários podem ser combinados por recurso na implementação (ex.: `padrao` + evento de
socket pontual), mas o teste sempre declara um id único.

## 5. Fixtures mínimas

| Fixture   |                     Quantidade | Detalhe                                                                                                  |
| --------- | -----------------------------: | -------------------------------------------------------------------------------------------------------- |
| NFTs      |                            60+ | ≥5 categorias, preços 0.02–12.30 ETH, edições variadas, 4 imagens do Figma                               |
| Usuários  |                              2 | `ana@nft-marketplace.test`/`Ana12345` (com carteiras, favoritos, pedidos) e `bruno@nft-marketplace.test`/`Bruno1234` |
| Cupons    |                              4 | `LAUNCH10`, `GREEN5`, `EXPIRED`, `FAKE`                                                                  |
| Carteiras |                     2 (da Ana) | principal `0x…`, secundária (ENS)                                                                        |
| Pedidos   | 1 confirmed + 1 pending (seed) | para recuperação pós-refresh                                                                             |

Estado consistente entre recursos: alterar um NFT no mock atualiza REST **e** emite o
evento Socket.IO correspondente (nunca só um dos lados).

## 6. Tempo real com Socket.IO no mock

| Item                | Definição                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Servidor            | `@mswjs/socket.io-binding` ligado ao worker MSW — handlers em `src/mocks/sockets/handlers.ts`                                                                        |
| Cliente             | `socket.io-client` real (`lib/socket/client.ts`) — os testes passam por ele; **não** há setter/callback direto na UI                                                 |
| Disparo dos eventos | (a) handlers MSW emitem após mutations relevantes; (b) timers do cenário (ex.: `preco-muda`); (c) endpoint `POST /api/_mock/emit` usado apenas pelo cenário/switcher |
| Payload             | formato `ARCHITECTURE.md` §5.1 (`type`, `resourceId`, `version`, `ts`, `payload`)                                                                                    |
| Reconexão           | cliente refaz REST ativo no `connect`; testes simulam queda com `socket.io` `disconnect()` forçado via cenário                                                       |

**Limitações do transporte (documentar na entrega):**

1. O binding roda no mesmo processo sobre WebSocket interceptado por MSW — não há servidor externo;
   firewall/offline real do navegador não é exercitado pelo servidor (o cenário `offline`
   simula no Axios e no binding).
2. Broadcast não sobe persistência: eventos perdidos com a aba fechada não são reenviados
   (por isso a reconciliação REST obrigatória após reconexão).
3. Ordenação é FIFO por conexão, mas o cliente **continua** tratando duplicatas/versões —
   os testes injetam eventos antigos deliberadamente (`POST /api/_mock/emit` com versão baixa).

## 7. Simulação de rede (MSW)

- Latência: `delay(ms)` fixa por cenário/recurso (nada de aleatório não-semeado).
- Timeout: cenário `timeout-pedido` usa `delay(15000)` maior que o timeout Axios (10 s).
- Offline: `onUnhandledRequest`/handlers retornam `networkError()` do MSW.
- Erros HTTP: `HttpResponse.json({ error: {…} }, { status })` seguindo o envelope de
  `docs/api/README.md` §2.

## 8. Testes Playwright (como o mock é controlado)

| Necessidade                  | Mecanismo                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| Estado inicial limpo         | `beforeEach`: `POST /api/_mock/reset` via Axios no contexto da página com worker ativo           |
| Cenário por teste            | `page.addInitScript(() => localStorage.setItem('gm_scenario', '<id>'))`                          |
| Relógio (expiração, horário) | `page.clock.install()` / `page.clock.fastForward()`                                              |
| Latência                     | cenário correspondente (nunca `sleep` fixo cego — aguardar localizadores)                        |
| Evento socket pontual        | Axios no contexto da página: `POST /api/_mock/emit` com `{ type, resourceId, version, payload }` |
| Acesso direto/refresh        | `page.goto(url)` no meio do fluxo (persistência `gm_db_v1` + sessão)                             |
| Visuais                      | dados estáveis do seed, `reducedMotion: 'reduce'` (skeleton estático), fontes locais             |

**Projects:** `desktop-chromium` (1440×900) e `mobile-chromium` (390×844);
`trace: 'retain-on-failure'`, `reporter: ['html', 'list']`; baselines de regressão visual
(`/`, detalhe, carrinho, pagamento) versionadas por viewport em `tests/e2e/__screenshots__/`.

Os 12 fluxos obrigatórios do enunciado (seção 9 do README do desafio) mapeiam 1:1 para
specs em `tests/e2e/` — cada spec declara seu cenário e não depende de outro teste.

## 9. Implementação e ajustes do contrato (fase 07)

- O catálogo contém 64 NFTs, cinco categorias e os quatro PNGs locais extraídos.
  `FAKE` é uma fixture de código inexistente, portanto não é persistido como cupom válido.
- O 18º cenário é `socket-queda`: fecha a conexão 1500 ms após a autenticação
  Socket.IO; o cliente real reconecta e deve reconciliar os recursos por REST.
- O transporte efetivo é WebSocket interceptado por MSW, com codificação Engine.IO /
  Socket.IO pelo binding. Não utiliza MessageChannel como transporte Socket.IO.
  O cliente usa `transports: ['websocket']`, pois polling HTTP não é implementado.
  Handshake e heartbeat são simulados; não há servidor externo, rooms ou namespaces.
- `preco-muda` arma seu timer na primeira cotação que inclui `golden-signal-160`.
  Esse endpoint é o sinal de abertura do checkout na camada de rede; o mock não importa rotas/UI.
- Controle funciona mesmo em `offline`; REST de negócio retorna erro de transporte.
  `GET /api/_health` permanece disponível para o bootstrap renderizar em qualquer cenário.
- `POST /api/_mock/scenario`: `{ "id": "lento" }` → `{ "ok": true, "id": "lento" }`.
  `GET` retorna `{ "id": "lento", "source": "runtime" }` (fontes: url/runtime/storage/env/default).
  Reset responde `{ "ok": true }`, restaura seed, cancela timers e seleciona `padrao`.
  A seleção na URL prevalece até ser removida; o switcher remove esse parâmetro ao trocar cenário.
- `POST /api/_mock/emit` aceita `{ type, resourceId, version, payload }`, acrescenta `ts`
  e responde `{ "ok": true }`. Versões maiores atualizam REST e broadcast; versões antigas
  apenas são transmitidas para testar dedupe, sem regredir a DB. Pedido terminal nunca regride.
- MSW no navegador não intercepta `APIRequestContext` do Playwright. Reset/emit precisam
  partir do contexto da página (Axios), depois que o worker está ativo; não há backend HTTP
  de controle no dev server. Os specs de bootstrap existentes usam esse contexto.
- Cupons e último cupom cotado por proprietário persistem na DB; mudar cupom incrementa
  `quoteVersion`. Timers não persistem: consulta/replay de pedido pendente rearma a simulação.
- Testes REST usam a instância Axios do projeto com `validateStatus` para inspecionar e
  validar também envelopes de erro; cada teste restaura seed e cancela timers.
