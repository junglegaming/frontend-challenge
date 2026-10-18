# Kurio — NFT Marketplace

Aplicação desenvolvida para o challenge NFT Marketplace de Front-end Jr., com catálogo de NFTs, carrinho, checkout e autenticação. O projeto demonstra integração com uma API simulada e atualização de dados em tempo real, com layouts desktop e mobile.

As APIs, os pagamentos e as carteiras são simulados. Não há integração com blockchain ou serviços financeiros reais.

## Preview

- **Deploy:** https://frontend-challenge-phi-seven.vercel.app/

## Homologação

Aplicação publicada na Vercel:

https://frontend-challenge-phi-seven.vercel.app/

## Funcionalidades

- Marketplace com 12 NFTs, listagem e página de detalhe.
- Busca por nome, filtro por faixa de preço, ordenação por nome/preço e paginação no frontend, com parâmetros na URL da Home.
- Detalhe de NFT com seleção de quantidade; carrinho com inclusão, remoção, alteração de quantidades e totais derivados dos itens.
- Carrinho persistente por visitante/usuário: ao autenticar, os itens guest são mesclados ao carrinho do usuário e o guest é esvaziado. Logout e troca de usuário mantêm os carrinhos privados isolados.
- Checkout com formulário, seleção de rede/carteira e resumo da compra.
- Pedidos com estados `pending`, `confirmed` e `rejected`, consulta por ID e criação idempotente.
- Confirmação automática do pedido por realtime; o carrinho é limpo somente quando o pedido está confirmado.
- Login, cadastro com confirmação de senha, logout e sessão persistida no navegador.
- Checkout, perfil, carteiras e confirmação de pedido exigem autenticação e retornam ao destino interno solicitado após login ou cadastro.
- Telas de perfil do colecionador e carteiras com formulários e feedback simulado. As alterações dessas telas ficam no estado local, sem persistência ou API própria.
- Eventos `nft.updated` e `order.updated` com Socket.IO e MSW.
- Layouts desktop e mobile, incluindo componentes específicos para Home, detalhe e checkout.
- Sete testes E2E em Chromium, incluindo os fluxos críticos, proteção de rotas e verificações responsivas de perfil/carteiras.

## Stack

| Responsabilidade | Tecnologia |
| --- | --- |
| Interface | React e TypeScript |
| Desenvolvimento e build | Vite |
| Estilização | Tailwind CSS |
| Rotas | TanStack Router |
| Estado remoto | TanStack Query |
| Cliente HTTP | Axios |
| API simulada | MSW |
| Realtime | Socket.IO Client e `@mswjs/socket.io-binding` |
| Ícones | Lucide React |
| Componentes | shadcn/ui: Button existente, baseado em Base UI, nas ações de salvar perfil e carteira |
| Testes E2E | Playwright |
| Análise estática | ESLint |

## Arquitetura

As consultas e mutations seguem o fluxo:

```text
UI → TanStack Query → Axios → MSW → fixtures/estado mock
```

Os contratos TypeScript em `src/contracts/` tipam as entradas e respostas da API. O Axios utiliza `/api` como baseURL, e uma única instância de `QueryClient` concentra o cache.

O estado local compartilhado usa Context API: `CartContext` gerencia itens, quantidades e totais; `AuthContext` mantém o usuário e a sessão exibidos na interface.

O fluxo de realtime reutiliza esse cache:

```text
MSW + binding Socket.IO → socket.io-client → listeners → TanStack Query → UI
```

Detalhes sobre rotas, endpoints, persistência e limitações estão em [ARCHITECTURE.md](ARCHITECTURE.md).

## Estrutura de pastas

```text
src/
  api/                 # Cliente Axios
  app/                 # Router e QueryClient
  components/          # Componentes compartilhados
  contracts/           # Contratos da API
  features/
    auth/
    cart/
    checkout/
    home/
    nfts/
    profile/
  mocks/               # Handlers REST, fixtures e simulação realtime
  realtime/            # Cliente Socket.IO e tipos dos eventos
e2e/                   # Testes dos fluxos críticos
public/assets/         # Assets da interface
playwright.config.ts
```

## Como executar

**Pré-requisitos:** Git, Node.js 22.12 ou superior e npm.

```bash
git clone https://github.com/jaovsb/frontend-challenge.git
cd frontend-challenge
npm install
npm run dev
```

Abra o endereço informado pelo Vite no terminal, normalmente `http://localhost:5173`.

A instalação limpa foi validada com `npm install`; não é necessário usar `--legacy-peer-deps`. Os mocks são iniciados automaticamente antes da aplicação, inclusive no build de demonstração. Não é necessário configurar um backend ou variáveis de ambiente para executar o cenário atual.

Para visualizar o build de produção localmente:

```bash
npm run build
npm run preview
```

O script `build` executa `tsc -b` antes do Vite, incluindo a checagem TypeScript. Não há script separado de typecheck.

## Credenciais mock

Usuários iniciais definidos em `src/mocks/fixtures/users.ts`:

| Usuário | E-mail | Senha |
| --- | --- | --- |
| Mock Collector | `collector@kurio.test` | `123456` |
| Mock Creator | `creator@kurio.test` | `123456` |

São credenciais fictícias para demonstração. A senha da fixture não é incluída nas respostas públicas de usuário.

## Testes

```bash
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

O Playwright inicia um servidor Vite dedicado em `http://127.0.0.1:4173`. Essa porta deve estar livre. Cada teste utiliza um contexto de navegador isolado, preservando o armazenamento durante os refreshes do próprio teste.

A suíte em `e2e/critical-flows.spec.ts` cobre:

1. **Catálogo → detalhe → carrinho:** abre um NFT, aumenta a quantidade e verifica item, quantidade e subtotal no carrinho.
2. **Persistência do carrinho:** altera a quantidade, recarrega a página e confere itens e valores.
3. **Checkout e realtime:** verifica o retorno do login ao checkout com o carrinho preservado, o POST com estado `pending`, o evento `order.updated`, a confirmação e a reconciliação REST, seguida do carrinho vazio.
4. **Login e perfil responsivo:** autentica com a fixture, verifica a sessão após refresh, navega entre perfil/carteiras e confere ausência de overflow e acesso às ações do Header em 375×812, 390×844, 414×896, 430×932 e 1440×1080.
5. **Cadastro:** verifica senhas divergentes e, após a correção, cria uma conta com e-mail único e confere a autenticação.
6. **Merge e isolamento de carrinhos:** verifica a transferência dos itens guest, a soma de quantidades duplicadas, persistência após refresh, consumo único do guest e isolamento entre Collector e Creator.
7. **Rotas privadas:** verifica acesso direto às quatro rotas protegidas, retorno após login, sessão após F5 e rejeição de redirects externos. O fluxo de login também exercita a sidebar e os botões shadcn de perfil/carteiras.

Esses são sete testes (`test(...)`) no arquivo, com verificações adicionais dentro de cada fluxo. Não há suíte de testes unitários nem regressão visual formal.

Os testes exercitam a aplicação com MSW e Socket.IO, sem injetar eventos no cache. O relatório HTML fica em `e2e/artifacts/report/`; screenshots e traces são mantidos para falhas em `e2e/artifacts/results/`. Os artefatos são ignorados pelo Git.

## Realtime

A simulação é local e utiliza transporte WebSocket. O MSW inicia antes do carregamento dinâmico do cliente Socket.IO, garantindo a interceptação da conexão pelo binding.

- **`nft.updated`:** após cerca de cinco segundos de conexão, o mock altera o preço de `nft-1` para `2.48 ETH` e emite o evento. O listener atualiza os caches da listagem e do detalhe. A mesma fixture atende ao REST.
- **`order.updated`:** o POST cria um pedido `pending`. Após cerca de seis segundos, o mock atualiza o estado compartilhado e emite a confirmação. O listener invalida a query do pedido, que consulta `GET /api/orders/:id` para atualizar a UI.
- **Reconciliação:** a conexão/reconexão invalida as queries de pedidos. Após F5, o ID armazenado permite consultar novamente o estado pelo REST.
- **Recusa:** o header `x-mock-order-result: rejected` no POST ativa o cenário de pedido recusado, mantendo o carrinho.

Para repetir a mudança inicial de preço, remova `kurio-realtime-nft-1-price` do localStorage e recarregue a página.

## Decisões técnicas

- **TanStack Query:** consultas, mutations e sincronização de estado remoto. O padrão global usa `staleTime` de 30 segundos e uma tentativa adicional; pedidos usam dados imediatamente obsoletos para reconciliação.
- **Context API:** estado compartilhado de carrinho e autenticação, separado do cache remoto.
- **localStorage:** persiste os itens em `kurio-cart:guest` para visitantes e `kurio-cart:<user.id>` para usuários autenticados; a sessão visual usa `kurio-auth`. Na autenticação, o guest é mesclado por `nft.id`, somando quantidades; após gravar o resultado, o guest é consumido para evitar reimportação. Logout troca para o guest vazio sem apagar carrinhos privados. A chave legada `kurio-cart` permanece ignorada. Contagem e total continuam derivados dos itens.
- **sessionStorage:** guarda o snapshot necessário ao recibo em `lastOrder`, os pedidos simulados em `kurio-mock-orders` e a chave da tentativa de checkout.
- **Idempotência:** a mesma `idempotencyKey` e o mesmo conteúdo recuperam o pedido existente; conteúdo diferente com a mesma chave retorna HTTP `409`.
- **REST + Socket.IO:** o evento sinaliza mudanças e o REST permite reconciliar o estado. Ambos utilizam os mesmos dados do mock.

## Qualidade

Resultados da validação local desta revisão:

| Verificação | Resultado |
| --- | --- |
| ESLint | Passando |
| Build de produção | Passando |
| E2E em Chromium | 7/7 |

Lighthouse: resultado da medição final informada, em **mobile, com build de produção**:

| Categoria | Pontuação |
| --- | ---: |
| Performance | 91 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

As pontuações acima foram informadas na avaliação; esta rodada de documentação não executa Lighthouse. Não há registro de uma matriz completa Home + Detail em mobile/desktop com três medições por cenário. O projeto Playwright usa Chromium desktop e varia o viewport no teste de perfil/carteiras, sem regressão visual formal.

## Limitações / escopo

- Projeto de desafio frontend, sem backend de produção, transação blockchain ou pagamento real.
- Carteiras e seleção de redes são simuladas; não há conexão com extensões ou SDKs Web3. O botão Etherscan é apenas visual/mock.
- Os botões Google e Facebook não possuem integração OAuth.
- Os dados da API vêm de MSW e fixtures. Novos cadastros e sessões do servidor mock ficam em memória; a sessão visual do frontend é restaurada do localStorage.
- A proteção de rotas é client-side. O AuthProvider não revalida automaticamente a sessão restaurada por `/api/auth/me`; logout remove a sessão local, sem revogação no mock.
- Perfil, avatar, senha e carteiras possuem interface demonstrativa; os formulários não persistem alterações nem atualizam credenciais reais ou o cadastro de carteiras do checkout.
- Busca, filtro, ordenação e paginação são aplicados no frontend. Favoritos completos e o fluxo completo de cupom/quote não foram implementados; não há endpoints próprios para esses recursos.
- O carrinho mantém cópias dos NFTs adicionados; o evento de preço atualiza o catálogo e o detalhe, sem reconciliar automaticamente os preços já armazenados no carrinho.
- Os sete E2E cobrem os fluxos descritos, sem cobertura integral dos 12 grupos do enunciado. Não há suíte formal completa de regressão visual nem matriz Lighthouse completa registrada.

## Autor

João Victor
