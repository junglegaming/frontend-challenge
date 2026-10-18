# Architecture

## Overview

Kurio é uma SPA React/TypeScript construída com Vite para o challenge NFT Marketplace. A interface consome uma API simulada no navegador; não há backend, blockchain ou pagamento real.

```text
React / Vite SPA
  → TanStack Router → features
      → TanStack Query → Axios (/api) → MSW → fixtures / estado mock
      → Context API → estado local / armazenamento do navegador

socket.io-client ↔ MSW WebSocket + Socket.IO binding
  → listeners → cache TanStack Query / invalidação → REST → UI
```

Em `src/main.tsx`, o bootstrap aguarda `worker.start()`, carrega dinamicamente o módulo realtime e inicia o cliente Socket.IO. Depois monta `QueryClientProvider → AuthProvider → CartProvider → RouterProvider` dentro de `StrictMode`. Os mocks também são iniciados no build publicado.

## Project organization

| Diretório | Responsabilidade |
| --- | --- |
| `src/app` | Router e instância compartilhada de QueryClient |
| `src/api` | Instância Axios com baseURL `/api` |
| `src/contracts` | Tipos públicos de NFT, autenticação e pedido |
| `src/features/auth` | Login, cadastro, AuthContext, chamadas HTTP e guard |
| `src/features/cart` | CartContext, persistência por identidade e interface do carrinho |
| `src/features/checkout` | Criação/consulta de pedido, checkout e confirmação |
| `src/features/home` | Catálogo e seções da Home |
| `src/features/nfts` | API/queries, detalhe e componentes de NFT |
| `src/features/profile` | Perfil, carteiras e sidebar; formulários demonstrativos locais |
| `src/components/ui` | Button shadcn/ui baseado em Base UI, usado nas ações de salvar perfil/carteira |
| `src/mocks` | MSW REST/WebSocket, fixtures e estado dos pedidos |
| `src/realtime` | Cliente Socket.IO único, listeners e contratos de eventos |
| `e2e` | Fluxos Playwright com MSW/realtime reais da aplicação |

## Routing

`src/app/router.tsx` declara as rotas com TanStack Router:

| Rota | Acesso / finalidade |
| --- | --- |
| `/` | Público; Home e catálogo |
| `/nfts/$nftId` | Público; detalhe e seleção de quantidade |
| `/cart` | Público; carrinho da identidade ativa |
| `/login`, `/register` | Públicos; autenticação simulada |
| `/checkout` | Privado; criação de pedido |
| `/order-confirmation` | Privado; consulta e acompanhamento do último pedido |
| `/profile` | Privado; dados do perfil |
| `/profile/wallets` | Privado; carteiras simuladas |

`RequireAuth` usa exclusivamente `useAuth()`. Sem sessão, não renderiza a página privada e navega com `replace` para `/login?redirect=...`, usando o pathname da rota correspondente. Login e cadastro preservam o parâmetro ao alternar entre os formulários e retornam ao destino após `setSession`.

`getSafeAuthRedirect` aceita somente `/`, `/checkout`, `/profile`, `/profile/wallets` e `/order-confirmation`, permitindo query/hash nesses caminhos. Valores ausentes, externos ou fora da lista retornam `/`.

No acesso direto/F5, o AuthProvider lê a sessão local antes de renderizar o guard. O rewrite SPA em `vercel.json` direciona as rotas para `/index.html`, permitindo deep links sem exigir páginas físicas por caminho.

## Server state

Uma única instância de QueryClient, em `src/app/query-client.ts`, atende à UI e ao realtime. O padrão global é `staleTime: 30_000` e `retry: 1`.

| Query key | Uso |
| --- | --- |
| `["nfts"]` | Catálogo via GET REST |
| `["nfts", id]` | Detalhe do NFT |
| `["orders", orderId]` | Pedido; habilitada com ID, `staleTime: 0`, sem retry automático |
| `["auth", "me", token ?? null]` | Hook disponível para usuário atual; habilitado com token, sem retry; não utilizado pelo AuthProvider |

Login, cadastro e criação de pedido usam `useMutation`. A mutation de criação salva a resposta inicial no cache do pedido. O catálogo recebe a lista inteira e aplica busca por nome, faixa de preço, ordenação e paginação no frontend. `App.tsx` mantém esses parâmetros na URL; interações comuns preservam scroll, enquanto paginação posiciona no catálogo.

O contrato `Nft` contém `id`, `name`, `price` e `imageUrl`; preço é string decimal em ETH. A fixture possui 12 NFTs e reutiliza quatro imagens locais.

## Local/client state

O carrinho usa Context porque representa a seleção local do visitante/usuário, sem recurso REST de carrinho. `items` é a fonte de verdade; contagem e total são derivados, sem persistência própria.

| Identidade | Chave localStorage |
| --- | --- |
| Visitante | `kurio-cart:guest` |
| Autenticado | `kurio-cart:<user.id>` |

A troca de identidade remonta o provider interno por chave, carregando seu armazenamento antes dos filhos. O provider anterior só escreve em sua própria chave.

Ao autenticar, a inicialização combina o carrinho próprio com o guest. A identidade do item é `nft.id`: duplicados somam quantidades e itens novos são acrescentados. O resultado é gravado na chave do usuário antes de remover o guest. A leitura/mesclagem não consome o guest no inicializador; o efeito controla o consumo, evitando importação duplicada nas repetições do StrictMode.

Logout seleciona o guest, vazio após o merge, sem apagar o carrinho privado. Collector e Creator mantêm namespaces separados e recuperáveis após login/F5. JSON inválido é descartado; a chave global legada `kurio-cart` é ignorada. Não há sincronização entre abas.

## Authentication

`AuthProvider` mantém `{ user, token }` e persiste a sessão visual em `kurio-auth`. Login/cadastro passam pelo Axios e MSW; respostas públicas não contêm senha. Os usuários iniciais são Mock Collector (`collector@kurio.test`) e Mock Creator (`creator@kurio.test`), ambos com senha fictícia `123456`.

O mock gera tokens aleatórios e mantém um `Map<token, userId>` em memória. `/api/auth/me` consulta esse mapa com `Authorization: Bearer <token>` e devolve o usuário público, ou `401`.

Logout é local: remove `kurio-auth` e limpa a sessão no Context. Não existe endpoint de logout ou revogação de token. Após F5, a interface restaura a sessão local sem chamar `/me`; usuários cadastrados e tokens do mock não persistem entre recargas. Assim, sessão visual restaurada não equivale à validação de uma sessão no servidor.

## REST / Axios / MSW

`src/api/client.ts` concentra o Axios. As funções de API usam caminhos como `/auth/login` e `/orders`, pois a base já contém `/api`. `setupWorker` registra handlers REST e realtime; requisições não tratadas usam `bypass`.

Endpoints existentes em `src/mocks/handlers.ts`:

| Método | Endpoint | Finalidade / respostas relevantes |
| --- | --- | --- |
| POST | `/api/auth/login` | Valida credenciais e retorna usuário/token; `401` se inválidas |
| POST | `/api/auth/register` | Cria usuário e sessão (`201`); `400` para campos ausentes, `409` para e-mail duplicado |
| GET | `/api/auth/me` | Usuário do token; `401` sem sessão válida no mock |
| GET | `/api/nfts` | Lista completa da fixture |
| GET | `/api/nfts/:id` | NFT por ID; `404` se ausente |
| POST | `/api/orders` | Valida entrada, aplica idempotência e cria pedido `pending` (`201`); `400` para payload inválido, `409` para conflito |
| GET | `/api/orders/:id` | Estado atual do pedido; `404` se ausente |

Não há endpoints REST de perfil, carteiras, favoritos, cupom/quote ou carrinho. Os formulários de perfil/carteiras têm estado local e feedback de sucesso, sem persistência REST.

## Realtime

O cliente único em `src/realtime/socket.ts` conecta à origem atual com transporte WebSocket. `src/mocks/realtime.ts` usa `ws.link` do MSW e `toSocketIo` de `@mswjs/socket.io-binding`. O import dinâmico após `worker.start()` permite ao Socket.IO capturar o WebSocket interceptado.

**NFT:** cerca de cinco segundos após a conexão, o mock altera `nft-1` para `2.48 ETH` na mesma fixture usada pelo REST e emite `nft.updated`. O listener cancela queries de NFTs em andamento e atualiza os caches existentes `["nfts"]` e `["nfts", id]` com `setQueryData`. A chave `kurio-realtime-nft-1-price` restaura esse preço conhecido após F5; não é um mecanismo genérico de persistência do catálogo.

**Pedido:**

```text
POST /api/orders → pending → estado mock atualizado
  → order.updated via Socket.IO → invalidação ["orders", id]
  → GET /api/orders/:id → confirmed ou rejected → UI
```

O prazo mock é de aproximadamente seis segundos a partir da criação. O caminho padrão confirma e gera `transactionId` simulado; o header `x-mock-order-result: rejected` seleciona recusa. O contrato só permite `transactionId` em pedidos confirmados.

O mock mantém mapas por ID e idempotencyKey e persiste seus registros em `kurio-mock-orders` no sessionStorage. Após recarga, reidrata os mapas e reagenda pedidos pendentes considerando a data original. O evento é emitido somente depois de atualizar esse estado compartilhado com REST.

Na conexão/reconexão do socket, queries com prefixo `["orders"]` são invalidadas para reconciliação. Não há polling nem protocolo manual, versionamento ou deduplicação avançada de eventos.

`lastOrder` guarda o ID, snapshot dos itens, carteira selecionada e `cartCleared` no sessionStorage. A confirmação consulta o pedido por ID; apenas `confirmed` dispara `clearCart`, protegido por referência e marcador persistido para evitar repetição. `pending`, `rejected` e erros de consulta preservam o carrinho. F5 recupera o recibo e reconcilia o pedido por REST na mesma sessão da aba.

## Order idempotency

O checkout reutiliza `kurio-checkout-idempotency-key` no sessionStorage durante a tentativa. O POST procura essa chave antes de criar um pedido:

- Mesma chave, mesmo total e mesma sequência de itens (`nftId` e quantidade): retorna o pedido existente, sem duplicação.
- Mesma chave com conteúdo diferente: retorna `409`.
- Chave nova e payload válido: cria um pedido `pending`.

A comparação considera a ordem dos itens; não há normalização canônica do payload. Ao observar estado terminal na confirmação, a chave da tentativa correspondente é removida. Não há serviço real de quote ou cálculo financeiro no servidor.

## Responsive strategy

Tailwind CSS aplica layouts por breakpoint. Home, detalhe e checkout têm componentes específicos para mobile. O Header compartilhado usa duas linhas abaixo de `lg`, com navegação de seções preservada e acesso ao perfil por ícone com nome acessível; a partir de `lg`, mantém o nome visível e o layout desktop. Perfil/carteiras empilham sidebar e formulários no mobile.

O teste de perfil/carteiras verifica `scrollWidth <= innerWidth`, navegação e visibilidade de perfil, logout e badge nos viewports 375×812, 390×844, 414×896, 430×932 e 1440×1080. Essa checagem cobre essas telas/condições, sem representar uma auditoria de todos os estados da aplicação ou comparação visual por screenshots.

## Testing

`e2e/critical-flows.spec.ts` contém sete testes Playwright:

1. Catálogo → detalhe → quantidade → carrinho, incluindo links de seções, filtros/ordenação/tabs e scroll/paginação.
2. Quantidade e subtotal do carrinho após F5.
3. Checkout protegido, login com retorno, POST `pending`, evento `order.updated`, confirmação, transactionId, reconciliação REST e carrinho vazio.
4. Login/sessão após F5, perfil/carteiras, uso dos botões shadcn e checagens responsivas nos cinco viewports.
5. Cadastro com divergência de senhas e criação de conta com e-mail único.
6. Merge guest/Collector, soma de quantidades, consumo único, isolamento do Creator e restauração do carrinho privado.
7. Acesso direto às quatro rotas privadas, retorno após login e bloqueio de redirects externos.

Cada teste tem contexto de navegador isolado. O Playwright inicia Vite em `127.0.0.1:4173`, usa Chromium e permite service workers. MSW e Socket.IO da aplicação participam do fluxo, sem injeção direta de eventos no cache. O teste de checkout verifica explicitamente `order.updated`; a suíte não possui um caso dedicado para `nft.updated` ou recusa de pedido.

```bash
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Lint executa ESLint. Build executa `tsc -b && vite build`; não há script separado de typecheck. Não existem suíte unitária nem suíte formal de regressão visual. Relatórios e artefatos E2E ficam em `e2e/artifacts/`.

## Deployment

O destino de homologação é Vercel, com saída estática do Vite em `dist`. `vercel.json` declara rewrite `/(.*)` → `/index.html` para o fallback SPA. Assets de `public`, incluindo imagens e `mockServiceWorker.js`, acompanham o build. O bootstrap não restringe MSW ao desenvolvimento; a versão publicada continua uma demonstração mockada, sem backend ou servidor Socket.IO externo.

`npm install` e `npm run dev` executam o projeto localmente; `npm run build` e `npm run preview` permitem inspecionar a saída de produção. A aplicação de homologação está publicada na Vercel:

https://frontend-challenge-phi-seven.vercel.app/

## Key technical decisions

- **TanStack Query:** centraliza estado remoto, cache e reconciliação após eventos.
- **Context/localStorage:** mantém carrinho e sessão visual locais, separados do estado remoto.
- **MSW:** simula a API na camada de rede, permitindo reutilizar o cliente HTTP da aplicação nos E2E.
- **Socket.IO:** transporta eventos pelo binding MSW, sem chamadas diretas do mock ao QueryClient.
- **Contratos TypeScript:** compartilham formatos entre API, mock, UI e eventos; o pedido usa união discriminada por status.
- **Idempotência:** evita repetir criação na mesma tentativa de checkout; REST e realtime compartilham o estado do pedido.

## Known limitations and specification deviations

- Blockchain, pagamentos, carteiras e transactionId são simulados; Etherscan é apenas uma ação visual/mock. Google/Facebook não implementam OAuth.
- Perfil, avatar, senha e carteiras não têm a persistência REST completa solicitada. Favoritos completos e o fluxo completo de cupom/quote não foram implementados.
- Busca, filtros, ordenação e paginação executam no frontend sobre a fixture, sem consultas parametrizadas no servidor.
- Auth é demonstrativa: guard client-side, sessão visual sem revalidação automática em `/me`, tokens/cadastros em memória e logout sem revogação. Os handlers de pedidos não autorizam por usuário; recibo e estado mock de pedidos são da sessão da aba, sem isolamento por identidade como o carrinho.
- O carrinho guarda snapshots dos NFTs; mudanças de preço do catálogo não atualizam automaticamente itens já adicionados. Não há sincronização entre abas.
- Os sete testes não cobrem integralmente os 12 grupos do enunciado, nem todos os erros/idempotência/eventos. Não existem testes unitários ou regressão visual formal completa.
- A medição final Lighthouse informada foi mobile, sobre build de produção: Performance 91, Accessibility 100, Best Practices 100 e SEO 100. Não há evidência registrada da matriz completa Home + Detail em mobile/desktop com três medições por cenário; esses números não representam essa matriz.

As limitações acima delimitam o escopo demonstrativo atual, sem implicar integrações de produção que o código não implementa.
