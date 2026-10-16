# Arquitetura e decisões

## Limites e organização

`domain.ts` contém contratos e aritmética ETH; `api/index.ts`, transporte Axios e política Query; `routes/router.tsx`, rotas/validação de URL/proteção; `pages`, fluxos; `components/ui`, componentes adaptados do padrão shadcn/ui; `constants/mocks`, a simulação independente da interface. Nenhum componente retorna fixtures nem altera o banco diretamente. As páginas acessam `/api` via Axios. Apenas os testes e o laboratório usam endpoints de controle dos cenários.

MSW 2.11.6 está fixado para compatibilidade com `@mswjs/socket.io-binding` 0.2.0. A inicialização termina antes do carregamento do router. Um transporte que estende o WebSocket do Engine.IO resolve o construtor global ao conectar, após a instalação do interceptor.

## Transporte REST

Respostas JSON usam os tipos de `domain.ts`; erros retornam `{message:string}`. Códigos: 401 sessão inválida, 403 pedido de outro usuário, 404 recurso inexistente, 409 conflitos/estoque/cotação/idempotência, 422 validação e 503 indisponibilidade transitória. Cada operação recebe latência reproduzível do cenário. O Axios limita a espera normal a 3500 ms.

| Método e rota                     | Corpo / resposta                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| `POST /api/register`              | `{name,email,password}` → usuário público (201)                                         |
| `POST /api/login`                 | `{email,password}` → usuário público; mescla carrinho visitante                         |
| `GET /api/session`                | Usuário público ou 401                                                                  |
| `POST /api/logout`                | Encerra sessão, desconecta subscriptions                                                |
| `GET /api/nfts`                   | `q,category,network,max,sort,page,favorites` → `{items,total,pages}`                    |
| `GET /api/nfts/:id`               | NFT, edições, estoque e versão                                                          |
| `GET /api/favorites`              | IDs do usuário                                                                          |
| `POST, DELETE /api/favorites/:id` | Inclui/remove e retorna IDs                                                             |
| `GET /api/cart`                   | `CartLine[]` do usuário/visitante                                                       |
| `POST, PATCH, DELETE /api/cart`   | `{nftId,edition,quantity}`; DELETE identifica NFT/edição                                |
| `POST /api/quote`                 | `{coupon}` → snapshot de itens, subtotal, desconto, taxa, total, fingerprint e validade |
| `POST /api/orders`                | Header `Idempotency-Key`; `{quoteId,walletId,network,name,email}` → pedido              |
| `GET /api/orders`                 | Pedidos apenas do usuário atual                                                         |
| `GET /api/orders/:id`             | Estado e recibo; exige propriedade                                                      |
| `GET, PATCH /api/profile`         | Consulta/altera nome, username, e-mail, ENS, apelido e avatar                           |
| `POST /api/password`              | `{currentPassword,password}`; valida hash atual e política de senha                     |
| `GET, POST /api/wallets`          | Lista; cria/atualiza por `id`; uma principal                                            |
| `GET /api/demo`                   | Cenário atual e opções                                                                  |
| `POST /api/demo/scenario`         | `{scenario}`; preserva banco                                                            |
| `POST /api/demo/reset`            | `{scenario}`; reset completo                                                            |
| `POST /api/demo/event`            | `{type,nftId?}`: price, stock, duplicate, old, disconnect, expire                       |

O backend simulado usa `localStorage` (`kurio:db:v1`) para sobreviver a refresh. É um banco de demonstração do navegador, sem garantias de segurança/autenticação de servidor. Contas são fictícias; SHA-256 com prefixo fixo evita senhas em claro, mas não substitui password hashing com salt e custo em produção. Avatares aceitam PNG/JPEG/WebP até 1 MB. Endereços são fictícios no formato 0x+40 hexadecimais inclusive nas redes simuladas Polygon/Solana; não representam validação criptográfica dessas redes.

## Sessão e isolamento

Sessões duram uma hora e são recuperadas por REST. Rotas privadas consultam a sessão no `beforeLoad`. Respostas 401 removem queries privadas e redirecionam fluxos protegidos para login com `returnTo` interno validado. Login/logout limpam o QueryClient; o socket é recriado por identidade. Eventos de pedido incluem usuário e são filtrados tanto na emissão quanto no recebimento. Pedidos de outro usuário retornam 403.

Carrinhos são separados por usuário e por visitante. Login mescla itens do visitante por NFT/edição, respeitando estoque, e esvazia o carrinho visitante. Perfil, carteira e favoritos só são alterados após validar a sessão. Preferência de cupom é local, sem conter dados privados. Logout remove a tentativa de compra local.

## Cache e respostas concorrentes

Queries têm `staleTime=30s`, refetch em foco e uma repetição para falhas de conexão/5xx. Erros 4xx e mutations não têm retry automático. Cotações são imediatamente stale para revalidação; pedidos pendentes têm reconciliação REST a cada 1500 ms como recuperação complementar ao socket. Pedidos terminais deixam de ser consultados periodicamente.

Chaves incluem parâmetros completos do catálogo e identidade nas consultas privadas. Axios recebe AbortSignal nas queries de catálogo, detalhe, carrinho, cotação e pedido. Mudanças na URL criam chaves diferentes; respostas antigas não substituem resultados de parâmetros atuais. Filtros reiniciam página 1; histórico e refresh restauram a URL.

Favoritos usam `onMutate` para cancelar a consulta, capturar o estado anterior e atualizar o cache. O estado desejado é uma variável da mutation, evitando dependência do valor já modificado pelo otimismo. Falhas restauram o snapshot; `onSettled` reconcilia com REST.

## Dinheiro e compra

ETH trafega como strings decimais. `toWei`/`fromWei` convertem para BigInt e de volta, sem cálculos em ponto flutuante. Quantidades são inteiras. Cupom KURIO10 desconta 10%; frações abaixo de 1 wei são truncadas na cotação. Taxa demonstrativa: 0.005 ETH para carrinho não vazio.

Uma cotação contém todos os valores e versões que determinaram o total e vale 120 segundos. O checkout reconsulta sessão e cotação antes de enviar. O handler valida novamente itens/edições/preços/cupom e compara fingerprints. Alterações exigem nova revisão; o cliente não confirma o pedido por conta própria.

A tentativa `{userId,key,body}` fica em `kurio:attempt` antes do POST. O mapa de idempotência é separado por usuário+chave e compara o conteúdo completo. Mesmo conteúdo retorna o mesmo pedido; conteúdo diferente retorna 409. Após timeout, o usuário pode recuperar a mesma tentativa, inclusive depois de refresh. Não há retries automáticos que criem outra chave.

Estados: pending → confirmed ou declined. Estados terminais são imutáveis. A simulação conclui após 1800 ms; uma consulta após refresh também reconcilia o resultado pendente pelo tempo de criação. Na confirmação, somente as quantidades compradas são removidas e o estoque das edições é reduzido. O recibo usa cópia independente da cotação; mudanças posteriores no catálogo não o alteram.

## Socket.IO e reconciliação

Transporte: WebSocket, sem polling HTTP, com `socket.io-client` real e binding que codifica/decodifica Engine.IO/Socket.IO no MSW. MSW 2.11 remove `/socket.io/` antes de comparar o endpoint; o handler usa a origem WS na raiz. Não há servidor externo, rooms ou namespaces personalizados. Essa limitação é exclusiva do mock e permite o mesmo build estático na demonstração.

Eventos `nft.updated` e `order.updated` carregam `{eventId,resourceId,version,userId?}`. Versões são comparadas com o último evento aceito e dados já presentes no cache; duplicatas e versões antigas não reaplicam efeitos. São sinais de invalidação: o REST continua sendo fonte autoritativa. Na reconexão, catálogo, detalhe, carrinho, cotação e pedido ativo são reconciliados. Listeners, intervalos de heartbeat e sockets são liberados ao desmontar/encerrar conexão.

## Interface, assets e acessibilidade

Referência: arquivo Figma Frontend Challenge, desktop 1440px com padding horizontal 120px, fundo `#140D0A`, tipografia monoespaçada, botões âmbar, sidebar e grade. A implementação usa IBM Plex Mono local. Ajustes: busca visível no catálogo, laboratório no rodapé, avisos de simulação e mensagens de estados não desenhados. Links editoriais não simulam páginas funcionais; indicam “em breve”.

As quatro artes foram exportadas em PNG original de 1254×1254 pixels e convertidas para WebP responsivo em 320, 640 e 960 pixels. Os arquivos originais e a procedência estão em docs/ASSETS.md. Não se afirma equivalência automática pixel a pixel dos espaçamentos.

Responsividade: 390, 768 e 1440px; filtros em diálogo no mobile, navegação compacta, formulários em uma coluna. Componentes Radix controlam foco/modalidade/Escape; foco retorna ao acionador. Há skip link, landmarks, labels, aria-pressed, status acessível e contraste melhorado dos botões. Movimento reduzido desativa shimmer/animações. Skeletons reservam espaço de imagem e o detalhe reserva a altura do conteúdo para evitar movimentar o rodapé.

## Validação e limites

E2E cobre operações e falhas nos dois viewports principais. As screenshots são evidências da implementação, não provas automáticas de fidelidade ao Figma. Lighthouse é executado com build real, assets e mocks ativos, três medições por página/perfil. Consulte `reports/lighthouse/summary.json` para resultados e ambiente; não são pontuações estimadas.

O estado local não sincroniza bancos entre dispositivos ou garante concorrência transacional entre múltiplas abas. Esta arquitetura atende à simulação isolada do desafio; para produção, autenticação, idempotência, estoque e pagamentos pertencem a um backend. A prévia privada não cumpre sozinha a exigência de um deploy público para avaliação externa.

A persistência, recuperação de respostas inválidas, regras atuais do checkout e decisões finais estão detalhadas em [docs/REVISAO_FINAL.md](docs/REVISAO_FINAL.md). O banco simulado usa Zustand persist com adaptador compatível com a chave legada e backup local; TanStack Query continua responsável pelos dados remotos e sua revalidação. Os assets originais de 1254 pixels substituíram as prévias de baixa resolução mencionadas no histórico.
