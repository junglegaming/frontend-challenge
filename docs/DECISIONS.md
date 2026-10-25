# Decisões técnicas

Registro das decisões que moldaram a solução, no formato de ADRs curtos: contexto, decisão, alternativas descartadas e custo aceito. A ordem segue a arquitetura, da rede até a interface.

---

## 1. Backend simulado só com MSW, sem servidor Node

**Contexto.** O enunciado exige mocks "na camada de rede", com o mesmo comportamento em desenvolvimento, demonstração e testes, além de deploy público.

**Decisão.** Todo o backend (REST e Socket.IO) roda no browser: handlers MSW, banco em `localStorage` e servidor Socket.IO via `@mswjs/socket.io-binding`. O app fala só com Axios e `socket.io-client`, sem saber que é mock.

**Alternativas.** Express + Socket.IO real (viola o requisito, exige hospedar um servidor com estado e quebra o deploy estático) e `json-server` (sem tempo real nem regras de negócio).

**Custo.** O "servidor" vive na aba: cada aba tem seu emissor de eventos. Abas se sincronizam pelo evento `storage`.

---

## 2. Servidor autoritativo, no formato de um BFF

**Contexto.** Dados de pagamento e preços não podem ser alterados por quem edita a requisição no DevTools.

**Decisão.** O cliente envia **intenções** (ids, quantidades, código de cupom) e nunca valores. Preço, desconto, taxa, total e status são calculados pelo servidor. `POST /orders` recebe só `quoteId`, `walletId`, `network` e o comprador.

**Alternativa.** Um BFF real (Vercel Functions). Foi descartado porque o enunciado exige backend em MSW, e um BFF não esconde do usuário os dados dele mesmo. O que um BFF de fato protege são segredos do servidor e a sessão em cookie `httpOnly`.

**Custo.** A sessão usa Bearer em `localStorage`, porque o service worker do MSW não emite cookies `httpOnly`. A versão de produção está descrita em [ARCHITECTURE.md](../ARCHITECTURE.md#sessão).

---

## 3. Contratos Zod como fonte única

**Decisão.** `src/schemas/` define schema e tipo (`z.infer`) lado a lado. Os services validam toda resposta com `schema.parse`, os formulários usam o mesmo schema no `zodResolver` e os handlers do mock validam o body com ele também.

**Por quê.** Um contrato divergente quebra na fronteira do service, com mensagem clara, e não dentro de um componente. Não existe pasta `types/` duplicando os schemas: o tipo inferido não tem como divergir.

---

## 4. Camadas `api → services → hooks → componentes`

**Decisão.** `api/client.ts` só configura o Axios (timeout, headers, normalização de erro em `ApiError`, evento de sessão expirada). `services/` tem uma função tipada por endpoint. `hooks/` concentra query keys, cache, invalidação e otimismo. Componentes nunca chamam Axios.

**Por quê.** Cada camada é testável e substituível isoladamente. Trocar o mock por uma API real muda só a `baseURL`.

---

## 5. ETH como string decimal e aritmética em `bigint` (wei)

**Decisão.** Valores trafegam como string (`"1.19"`). Toda conta acontece em wei (`10n ** 18n`) em `src/lib/eth.ts`. A conversão para texto só ocorre nas bordas.

**Alternativa descartada.** `decimal.js`/`big.js`: uma dependência a mais para o que o `bigint` nativo já resolve com precisão exata.

**Prova.** `0.1 + 0.2 = 0.30`, e o desconto de 10% sobre 26.83 dá `2.683`, sem erro de ponto flutuante (`src/lib/eth.test.ts`).

---

## 6. Estado do catálogo na URL

**Decisão.** Busca, filtros, aba, ordenação e página são *search params* validados por Zod no `validateSearch` da rota. Qualquer mudança de filtro remove `page`. A busca usa debounce de 300 ms com `replace: true`.

**Consequência.** Refresh, voltar/avançar e links compartilhados restauram o mesmo resultado. Cada combinação de parâmetros vira uma query key própria, e o `AbortSignal` do TanStack Query cancela a requisição obsoleta. Por isso uma resposta antiga nunca sobrescreve a atual (testado no cenário `out-of-order`).

---

## 7. Carrinho no servidor, com merge do visitante

**Decisão.** O carrinho pertence ao servidor e é identificado por usuário ou, para visitante, pelo header `X-Guest-Cart` (uuid gerado no cliente). No login, `POST /cart/merge` soma os itens respeitando a disponibilidade. Toda mutation devolve o carrinho recalculado, que vai direto para o cache.

**Por quê.** O resumo exibido é exatamente o da API: o cliente nunca recalcula total, o que evita divergência com a cotação usada na compra.

---

## 8. Cotação congelada e `QUOTE_STALE`

**Decisão.** "Revisar pedido" cria uma cotação (`POST /quote`) com itens, preços, cupom e taxa congelados. Ao confirmar, o servidor recalcula. Se preço, disponibilidade, cupom ou taxa mudaram, responde 409 `QUOTE_STALE` **já com a nova cotação**, e a UI mostra a diferença e exige nova confirmação.

**Defesa em profundidade.** Se um `nft.updated` de item do carrinho chega durante a revisão, a cotação é descartada no cliente antes mesmo do clique. O 409 do servidor cobre o caso de o evento se perder.

---

## 9. Idempotência do pedido

**Decisão.** Uma `Idempotency-Key` por cotação, gerada e **persistida antes do envio**, junto com o corpo exato da requisição. Clique repetido, timeout ou refresh reenviam a mesma chave e o mesmo corpo, e o servidor devolve o mesmo pedido. Mesma chave com corpo diferente resulta em 409 `IDEMPOTENCY_CONFLICT`.

**Detalhe de implementação.** A tentativa vive num store observável (`useSyncExternalStore`) e não no estado local do hook. O checkout e a tela de recuperação compartilham a mesma tentativa ([BUGS.md](BUGS.md#2-retry-após-timeout-não-levava-ao-recibo)).

---

## 10. Eventos em tempo real: versão, deduplicação e reconciliação

**Decisão.** Todo evento carrega `eventId`, `resource`, `version` e `occurredAt`. O cliente descarta um evento se o `eventId` já foi visto **ou** se a versão é menor ou igual à maior conhecida (do mapa local ou da versão em cache). Em **todo** `connect` (inicial ou reconexão), invalida catálogo, detalhes, carrinho e pedidos cujo dado é anterior ao handshake (reconciliação via REST). A primeira conexão também tem uma janela: um evento emitido entre a resposta REST e o handshake se perderia. O filtro `dataUpdatedAt < connectedAt` evita refetch do que acabou de chegar.

**Por quê.** Uma regra só (`version <= known`) cobre duplicatas, eventos atrasados e reenvios, sem fila de reordenação. Eventos de pedido só são entregues às conexões do dono, validadas pelo token do handshake.

---

## 11. Socket.IO por sessão: token na query, Manager próprio e import tardio

Três decisões que vieram de limitações reais, cada uma documentada no código:

1. **Token na query** e não no `auth`: o binding do MSW confirma o handshake sozinho e ignora o payload do CONNECT.
2. **`forceNew: true`**: sem isso, o `io()` reaproveita o Manager em cache para a mesma URL, e o socket do usuário logado herda a query anônima ([BUGS.md](BUGS.md#1-pedido-confirmado-no-servidor-mas-a-tela-ficava-aguardando)).
3. **`socket.io-client` importado sob demanda**: o `engine.io-client` captura `globalThis.WebSocket` ao ser avaliado, então ele precisa carregar depois de o MSW aplicar o patch. De quebra, sai do bundle crítico.

O servidor simulado também envia ping (`"2"`) a cada 20 s. Sem isso, o cliente encerraria a conexão por timeout de heartbeat.

---

## 12. Sessão: trocar o valor, nunca remover a query

**Decisão.** No login, logout e expiração, os dados privados são removidos do cache, mas a query `['session']` é **mantida** e só recebe um novo valor via `setQueryData`. As query keys privadas carregam o `userId`, e o socket é recriado a cada troca de usuário.

**Por quê.** Remover uma query com observers ativos (root, header) deixa esses observers presos a uma instância órfã: a UI não vê a troca de usuário ([BUGS.md](BUGS.md#1-pedido-confirmado-no-servidor-mas-a-tela-ficava-aguardando)).

---

## 13. Cenários determinísticos e controles do "servidor"

**Decisão.** 13 cenários selecionáveis por `?scenario=` ou pelo painel de cenários, com dados e latências gerados por PRNG de seed fixa. Os controles (`window.__kurioMock`: alterar preço, esgotar, derrubar socket, expirar sessão, reenviar ou enviar evento antigo) agem **no banco e no transporte Socket.IO**, nunca no cache da UI.

**Por quê.** É o mesmo caminho de um evento real. Os testes de tempo real passam pelo `socket.io-client` de verdade, e os de REST pelos handlers MSW, como o enunciado exige.

---

## 14. Estratégia de testes

- **E2E primeiro.** O enunciado avalia comportamento observável. Testes unitários ficaram só para lógica pura e crítica: aritmética ETH e regras de domínio do mock (cotação, confirmação, merge).
- **Estado isolado.** Cada teste parte de `localStorage` limpo (o banco volta ao seed) e com o cenário injetado antes do primeiro script da página.
- **Tempo controlado.** `page.clock` no teste de expiração de sessão e na regressão visual, além de cenários de latência determinística.
- **Três viewports.** Os projetos `desktop` (1440), `tablet` (768) e `mobile` (390) rodam a suíte inteira. O tablet entrou depois e encontrou um overflow real que os outros dois não viam ([BUGS.md](BUGS.md#9-overflow-e-herói-cortado-em-768-px)).
- **Visual.** Baselines versionadas de início, detalhe, carrinho e pagamento nos três viewports, com toasts mascarados. Há baselines `darwin` (dev local) e `linux` (geradas na imagem oficial do Playwright via `npm run test:e2e:docker:update`, as mesmas que a CI usa).
- **Overflow medido contra a largura do dispositivo**, não contra `innerWidth`, que o próprio overflow infla no mobile ([BUGS.md](BUGS.md#3-perfil-e-carteiras-renderizavam-com-991-px-no-mobile)).

---

## 15. Performance: medir antes de otimizar

O caminho crítico mobile é bootstrap → MSW → app → `/api/nfts` → imagem. Baixar app e MSW em paralelo parecia ganho óbvio, mas **piorou** o LCP de 3,3 s para 4,1 s: sob banda limitada, requisições paralelas dividem a conexão. A versão sequencial ficou, com a justificativa no código e em [LIGHTHOUSE.md](LIGHTHOUSE.md).

---

## 16. Falhas de rota com recuperação, não tela branca

**Decisão.** `defaultErrorComponent` no router (`RouteError`): mensagem, "Tentar novamente" (`reset()` + `router.invalidate()`, que refaz os loaders) e link para o início. Erros esperados de dados (rede, 4xx, 5xx) continuam tratados dentro de cada tela com `ErrorState`. O fallback de rota cobre só o inesperado.

**Por quê.** Um erro de render sem boundary derruba a árvore inteira. Com o fallback por rota, o header e a navegação continuam vivos.

---

## 17. CI reproduzível e baselines por plataforma

**Decisão.** GitHub Actions com três jobs: qualidade (typecheck, lint, unitários, build), E2E dentro da imagem `mcr.microsoft.com/playwright:v1.64.1-noble` e Lighthouse. Relatório HTML e relatórios do Lighthouse saem como artefatos.

**Por quê.** Screenshot depende da renderização de fonte do sistema. Baselines geradas no macOS falham no Linux da CI. Rodando a suíte na mesma imagem localmente (`npm run test:e2e:docker`) e na CI, as baselines `-linux.png` são as mesmas nos dois lugares.

**Custo.** Dois conjuntos de baselines versionados (darwin e linux).

---

## 18. Login como modal sobre a página atual (`?auth=`)

**Decisão.** O botão "Entrar" adiciona `?auth=login` à URL atual e o root renderiza o diálogo por cima da página real, como no Figma. Fechar remove só o parâmetro. As rotas `/login` e `/signup` continuam existindo para os guards, a sessão expirada e links diretos, mas só redirecionam: abrem o mesmo diálogo sobre a página de destino (se pública) ou sobre a home. Assim o fundo é sempre uma página real, idêntico ao Figma.

**Por quê.** Antes, o login era uma rota com um fundo fixo, e "Fechar" navegava para o `redirect`. Quando o redirect era uma rota protegida, o guard mandava de volta ao login e o modal parecia não fechar. Com o estado no search param, fechar é sempre seguro, e em `/login` fechar só volta ao `redirect` se ele for público.

---

## 19. Skeleton em toda request nova, não só na primeira

**Decisão.** A lista continua com `placeholderData: keepPreviousData` (sem piscar o layout na troca de chave), mas a tela usa `isPlaceholderData` para trocar os cards antigos por skeletons enquanto os novos não chegam.

**Por quê.** Na validação manual, o carregamento após trocar filtro ou página era invisível: os cards antigos ficavam e só um texto pequeno avisava. O enunciado pede skeletons nos componentes dependentes de dados.

---

## 20. Perfil com um único "Salvar"

**Decisão.** Um formulário e um botão, como no Figma. O submit envia o perfil só se ele mudou e a troca de senha só se algum campo de senha foi preenchido, em paralelo (`Promise.allSettled`). Cada erro da API volta para o campo da request que falhou, e o toast diz exatamente o que foi salvo.

**Por quê.** Revisa a decisão anterior (dois botões). O risco de sucesso parcial ambíguo foi resolvido com o retorno por campo e o toast específico.

---

## 21. Stub do `tough-cookie` no bundle dos mocks

**Decisão.** Alias de `tough-cookie` para um stub mínimo (`src/mocks/tough-cookie-stub.ts`).

**Por quê.** Era ~55% do chunk que bloqueia o primeiro render (o MSW precisa subir antes do app). A home mobile estava em 89, abaixo da meta, e foi para 95 ([LIGHTHOUSE.md](LIGHTHOUSE.md#home-mobile-de-89-para-95-o-cookie-jar-que-ninguém-usava)).

**Custo.** Handlers não podem usar cookies enquanto o alias existir. O comentário no stub diz quando removê-lo.
