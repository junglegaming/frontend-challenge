# Arquitetura — Kurio

Documento técnico do projeto: decisões, fluxos de dados e limitações. Setup e
comandos estão no [`README.md`](./README.md).

## 1. Visão geral

```
Navegador
├── React 19 + TanStack Router (rotas, search params na URL, guardas)
│     ├── TanStack Query (queries/mutations) → Axios → REST /api/*
│     └── socket.io-client (1 conexão por sessão) ── wss://realtime.kurio.test
│
└── MSW (service worker)
      ├── handlers REST → banco simulado (localStorage: kurio:mock-db)
      └── WebSocket (@mswjs/socket.io-binding) → nft.updated / order.updated
```

Não existe backend real: **toda** a rede é interceptada pelo MSW no navegador,
inclusive no build publicado (`VITE_ENABLE_MOCKS=true`). Toda mudança no banco
simulado aparece na resposta REST **e** no evento correspondente (ex.: o cenário
`price_changed` altera o preço e publica `nft.updated`).

Boot (`src/main.tsx`): o chunk de entrada só lê a flag de mocks
(`app/mocks-flag.ts`); se ligada, sobe o worker e só então importa o app
(`app/mount.tsx`), que valida as variáveis de ambiente com zod (`app/env.ts`).

## 2. Estrutura

```
src/
  app/            mocks-flag, env (zod), query client, mount
  routes/         rotas file-based (composição, guardas, validação de search)
  features/
    auth/         api (sessão, login, cadastro, logout), sessão expirada
    catalog/      api (lista com facetas, detalhe, avaliações) + componentes
    favorites/    api (toggle otimista com rollback) + ação com login
    cart/         api (carrinho, cotação), cupom compartilhado, avisos por item
    checkout/     use-checkout (estado), formulário, layouts, revisão, carteira
    orders/       api (pedido idempotente com retry seguro)
    account/      api (perfil, carteiras, conexão), formulário de carteira, menu
  shared/
    api/          http-client (Axios, ApiError, sessão expirada), query-keys
    contracts/    schemas zod: fonte única dos tipos de transporte e eventos
    realtime/     url, filtro de eventos, sincronização por sessão
    lib/          money (big.js), redirect seguro, media query, hash, cn
    session/      token, visitante, ownerKey
    ui/           shadcn/ui tematizado (Button, Input, Select, Dialog, Tabs…)
    components/   layout, skeletons (shimmer), 404
  mocks/          db, fixtures, handlers, pricing, scenarios, realtime, carteiras
```

## 3. Contratos REST

Base `/api`. Os schemas zod de `src/shared/contracts` são usados pelo cliente
(validação das respostas) **e** pelos handlers do MSW (validação dos corpos).
Erros sempre no envelope `{ error: { code, message, fields?, retryable? } }`.

| Recurso   | Endpoints                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Sessão    | `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout`                                   |
| NFTs      | `GET /nfts` (busca/filtros/ordenação/paginação + facetas), `GET /nfts/:id`, `GET /nfts/:id/reviews`                   |
| Favoritos | `GET /favorites`, `POST /favorites/:nftId`, `DELETE /favorites/:nftId` (autenticado)                                  |
| Carrinho  | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`, `DELETE /cart/items/:itemId`                            |
| Cotação   | `POST /quote` (mesmo cálculo da criação do pedido)                                                                    |
| Pedidos   | `POST /orders` (header `Idempotency-Key`), `GET /orders/:id` (só o dono)                                              |
| Perfil    | `GET /profile`, `PATCH /profile`, `POST /profile/password`                                                            |
| Carteiras | `GET /wallets`, `POST /wallets`, `PATCH /wallets/:id`, `POST /wallets/:id/connect`, `DELETE /wallets/connections/:id` |

Pontos relevantes do contrato:

- **`GET /nfts`** devolve `facets` (contagem por coleção e rede, considerando os
  demais filtros ativos) — a sidebar de filtros não tem números fixos.
- **Carrinho**: o item guarda a escolha (NFT, edição, quantidade, preço na
  adição); preço, nome, imagem, edição e estoque vêm do catálogo atual.
  `addedPriceEth ≠ priceEth` indica que o preço mudou.
- **`POST /orders`** recebe `walletId`, `connectionId` (conexão simulada ativa) e
  `expectedTotalEth` (total que o usuário revisou).
- **Pedido** é um snapshot imutável: itens (com imagem e preço), totais e
  `payment` (carteira, rede e provedor usados).

Códigos: `VALIDATION_ERROR` (422, com `fields`), `SESSION_INVALID`,
`UNAUTHORIZED` (401), `FORBIDDEN`, `NOT_FOUND` (404), `CONFLICT`,
`AVAILABILITY_CONFLICT`, `STALE_QUOTE`, `IDEMPOTENCY_CONFLICT`,
`WALLET_REJECTED`, `WALLET_DISCONNECTED` (409), `COUPON_INVALID`,
`COUPON_EXPIRED` (422), `INTERNAL_ERROR` (503), `TIMEOUT`, `NETWORK_ERROR`
(cliente).

## 4. Eventos Socket.IO e reconciliação

| Evento          | Payload                                 | Efeito no cliente                                                               |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------- |
| `nft.updated`   | `{ eventId, nftId, version, priceEth }` | revalida catálogo, detalhe, carrinho e cotação; avisa se o NFT está no carrinho |
| `order.updated` | `{ eventId, orderId, status, version }` | revalida o pedido (só se for desta sessão); confirmado → revalida o carrinho    |

- **Transporte**: `@mswjs/socket.io-binding` sobre o `ws.link` do MSW, com
  `socket.io-client` real (transporte `websocket`). Nenhum evento é simulado
  chamando setters, callbacks ou o cache.
- **Uma conexão por sessão**, aberta no layout raiz (`useRealtimeSync`). Trocar
  de usuário fecha o socket anterior e remove todos os listeners: eventos de
  uma sessão não alcançam os dados de outra.
- **Identidade e ordem**: o `eventId` é derivado de recurso + versão. O
  `createEventGate` descarta duplicatas e versões iguais/anteriores à última
  aplicada — sem regredir estado nem reaplicar efeitos (ex.: o aviso aparece
  uma vez).
- **REST como fonte de verdade**: o evento só invalida; o dado exibido vem da
  API. Após **reconectar**, todas as queries ativas são revalidadas (eventos
  perdidos na queda não deixam a tela desatualizada).
- `order.updated` de um pedido que não está no cache do dono atual é ignorado.

## 5. Sessão

- Token opaco no `localStorage` (`kurio:token`); **senha nunca é persistida**
  (o banco guarda só um hash do mock).
- `ownerKey` (cliente) = `user:<token>` ou `visitor:<visitorId>` — isola o cache
  por dono. No servidor simulado, o carrinho do usuário é indexado pelo **id**
  (sobrevive a novos logins).
- Sessão recuperada no refresh via `GET /auth/session`.
- **Expiração** durante a navegação ou o checkout: um 401 em requisição feita
  com o token **atual** limpa a sessão e o cache, mostra um aviso e reavalia as
  rotas; os guardas levam a `/login?redirect=<rota>`. Depois do login, o
  usuário volta à rota (o carrinho está no servidor; a chave de idempotência e
  o cupom ficam em `sessionStorage`). 401 atrasado de um token antigo é ignorado.
- `redirect` aceita só caminhos internos (`toSafeRedirect`) — sem redirecionamento aberto.
- **Logout/troca de usuário**: limpa token e cache (`queryClient.clear()`) e
  fecha o socket da sessão.
- **Merge do carrinho**: no login/cadastro, os itens do visitante entram no
  carrinho do usuário.

## 6. Carrinho e cotação

- Quantidades inteiras, limitadas ao estoque da edição (o stepper trava no
  limite e enquanto a atualização anterior não volta).
- Avisos por item: preço alterado, estoque insuficiente, edição esgotada.
- Resumo (subtotal, desconto, taxa, total) vem sempre de `POST /quote`,
  calculado com `big.js` (ETH nunca trafega nem é comparado como `number`).
- Cupom validado na cotação (`KURIO10`, `LANCAMENTO5`, `EXPIRADO20` expirado) e
  levado do carrinho ao pagamento.

## 7. Checkout, idempotência e confirmação

- **Carteira**: só carteiras cadastradas. O usuário escolhe carteira, rede e
  provedor e "conecta" (simulação: aprovação, recusa no cenário
  `wallet_rejected`, desconexão manual ou no cenário `wallet_disconnected`).
  Mudar carteira, rede ou provedor invalida a conexão.
- **Validação** dos campos do layout (React Hook Form + zod) e **revisão** em
  diálogo antes do envio.
- **Cotação revisada**: o primeiro total exibido é o revisado. Se mudar (evento
  de preço/estoque, taxa), um alerta bloqueia a confirmação até o aceite
  explícito. A API também confere `expectedTotalEth` e responde `STALE_QUOTE`.
- **Idempotência**: chave por tentativa em `sessionStorage` (sobrevive a
  refresh). Mesma chave + mesmo conteúdo = mesmo pedido; conteúdo diferente =
  `IDEMPOTENCY_CONFLICT` (o cliente gera uma nova tentativa). Em timeout ou
  falha de rede, a mutation **reenvia a mesma tentativa** e recebe o mesmo
  pedido — sem compra dupla.
- **Estados**: o pedido nasce `pending`; o pagamento se resolve em ~2 s
  (`confirmed` ou `declined`, terminais) com `order.updated`. O instante e o
  resultado ficam persistidos no banco simulado, então recarregar a página com
  o pedido pendente não o deixa travado.
- **Confirmação só com resposta da simulação**; ao confirmar, o servidor baixa o
  estoque (publicando `nft.updated`) e remove do carrinho **só** os itens e
  quantidades comprados. Recusado: o carrinho fica intacto.
- **Recibo**: snapshot do pedido (itens, imagem, preços, taxas, carteira).
  Referências de transação e o link do explorador são simulados e sinalizados
  como tal.

## 8. Cache, retries e sincronização

- Queries: `staleTime` 15 s, `refetchOnWindowFocus`; sem retry para 4xx, até 2
  retries para transitórios/5xx.
- Catálogo: `keepPreviousData` (resultado anterior visível, com aviso de
  "atualizando") e `signal` do TanStack Query no Axios — trocar filtros cancela
  a requisição anterior; resposta antiga não sobrescreve a nova.
- Mutations: sem retry, exceto a criação do pedido em erros transitórios
  (seguro por idempotência).
- **Otimista com rollback**: favoritos (falha → volta ao estado anterior e avisa).
- Invalidação após mutations (carrinho, carteiras, perfil) e eventos (seção 4).
- Query keys isolam por dono e por parâmetros.

## 9. Interface, acessibilidade e desvios do Figma

- shadcn/ui tematizado com os tokens do design system: Button, Input, Select,
  Dialog (revisão do pedido, zoom da arte) e Tabs (detalhe do NFT).
- Diálogos prendem o foco, fecham com Esc e devolvem o foco ao gatilho.
- Skeletons com shimmer (catálogo, detalhe, resumo, facetas), respeitando
  `prefers-reduced-motion`.
- Feedback acessível: avisos de mutations e de tempo real via `sonner`
  (`aria-live`), erros associados aos campos (`aria-invalid` + `aria-describedby`).
- Responsivo de 320 a 1920 px (detalhes em `docs/12-RESPONSIVIDADE.md`).

Desvios conscientes:

- **Coleções**: as fixtures usam as categorias do Figma ("Arte digital",
  "Fotografia"…) como coleções, para que filtro e contagens sejam reais.
- **Redes**: Ethereum, Polygon e Solana (contrato), em vez de Arbitrum/Optimism.
- **Tipo de carteira**: WalletConnect, MetaMask e Coinbase (provedores
  simulados); Phantom foi removido.
- **Carteiras**: nome, nome do perfil e e-mail vêm do perfil (somente leitura).
- **Código de indicação** obrigatório no checkout e nas carteiras, como no
  asterisco do layout.
- Seções fora do escopo (atividade, ofertas, suporte, editoriais) aparecem como
  no layout, mas marcadas "em breve", sem aparentar ação.
- Artes em WebP (mesmas dimensões dos PNGs do Figma, ~94% menores).

## 10. Limitações

- Banco simulado em memória + `localStorage`; o reset restaura o seed.
- `@mswjs/socket.io-binding` não implementa salas/namespaces: os eventos são
  enviados a todas as conexões e o cliente filtra pelo que conhece.
- Conexões de carteira vivem só em memória: recarregar exige reconectar.
- O timeout do cliente HTTP (10 s) é nativo do XHR, então o teste de timeout
  usa o relógio real.
- Sem upload real de avatar (URL).

## 11. Testes

- **Unit (Vitest)**: ETH com `big.js`, cotação/cupons, filtro de eventos,
  redirect seguro, helpers.
- **E2E (Playwright, Chromium desktop + Pixel 7)** — cada teste parte de um
  contexto novo (estado isolado):
  1. busca, filtros combinados, ordenação, paginação e histórico (+ 404);
  2. detalhe por acesso direto, NFT inexistente, edição esgotada;
  3. cadastro (com conflito), login inválido, sessão expirada (navegação e
     checkout), logout e troca de usuário sem vazamento;
  4. favoritos com persistência e falha de mutation com rollback;
  5. carrinho: quantidades/limite, remoção, cupons, refresh e login;
  6. compra completa até o recibo, removendo só o comprado;
  7. pagamento recusado, cliques repetidos e timeout com o mesmo pedido;
  8. perfil, avatar, senha e carteiras com erros locais e da API;
  9. preço/estoque via Socket.IO durante o checkout e no carrinho;
  10. eventos duplicados/antigos, queda de conexão e refresh com pedido pendente;
  11. teclado (skip link, foco do diálogo, abas) e axe sem violações críticas;
  12. skeleton em carregamento lento, latência variável, falha 5xx/offline e
      nova tentativa.
- Regressão visual de início, detalhe, carrinho e pagamento (baselines
  versionadas), relatório HTML e trace de toda falha.
- Lighthouse: ver seção de performance no README.
