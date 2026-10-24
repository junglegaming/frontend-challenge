# Feature Specification: Ambiente de produção do front-end

**Feature Branch**: `008-web-production-env`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "front-end configurar ambiente de produção" — publicar o `apps/web` na Vercel como um ambiente de produção real e repetível: build, variáveis de ambiente, roteamento, ligação com o back-end `apps/api` (feature 007) e entrega segura.

Fatos do código que moldam esta spec (verificados, não supostos):

1. **O catálogo, auth, carrinho, pedidos etc. continuam 100% simulados por MSW** (constituição, Princípio V). Um "ambiente de produção" deste front-end é, portanto, um **build de demonstração com mocks ligados** para `/api/*`. O único tráfego real é o do `ledger` (`/backend/*`, feature 007).
2. **Hoje o MSW ligaria também o `/backend/*`** em produção (os handlers do `ledger` ficam sempre registrados), então a API real nunca seria chamada.
3. **O domínio `coins` (feature 006) aponta para `http://localhost:4000` por padrão.** O `server/` usa SQLite e não roda na Vercel; em produção o navegador do visitante tentaria falar com a própria máquina dele.
4. A API `apps/api` tem um deploy de Production que **responde `404` em todas as rotas** (defeito da feature 007, T022/T023); sem isso resolvido, a ligação real não funciona.
5. `apps/web` ainda **não está vinculado a nenhum projeto Vercel**; não há CI no repositório.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitante usa a vitrine publicada (Priority: P1)

Um visitante abre a URL pública de produção e navega pela vitrine (início, detalhe de NFT, carrinho, login, perfil) como no ambiente de desenvolvimento, inclusive abrindo uma URL profunda diretamente e recarregando a página.

**Why this priority**: Sem o build publicado e o roteamento da SPA funcionando, nada mais desta feature é alcançável. É também a menor fatia entregável: um demo público.

**Independent Test**: Abrir a URL de produção, navegar pelas telas principais, abrir diretamente `/nft/nft_001` e `/account/profile` (com sessão) e recarregar; nenhuma resposta `404` do servidor e nenhum erro de console atribuível à configuração.

**Acceptance Scenarios**:

1. **Given** a URL de produção, **When** o visitante abre `/` , **Then** a vitrine carrega com o MSW ativo e os dados simulados de sempre.
2. **Given** uma URL profunda (ex. `/nft/nft_001`), **When** aberta diretamente ou recarregada, **Then** a SPA responde (fallback para `index.html`), nunca um `404` da plataforma.
3. **Given** uma nova versão publicada, **When** o visitante recarrega, **Then** recebe o `index.html` e o `mockServiceWorker.js` novos (sem ficar preso em versão antiga em cache), enquanto os arquivos com hash em `/assets/*` são cacheados por longo prazo.
4. **Given** o ambiente de produção, **When** a rota interna `/design-system` é acessada, **Then** o comportamento é o já definido hoje (disponível apenas com mocks ligados), sem mudança.

---

### User Story 2 - Produção fala com o back-end real, não com o mock (Priority: P2)

No ambiente de produção, as chamadas do domínio `ledger` (`/backend/*`) chegam de fato à API `apps/api` pelo proxy de mesma origem, e **não** são interceptadas pelo MSW; o restante (`/api/*`) continua simulado.

**Why this priority**: É o que dá sentido à ligação front–back da feature 007. Depende de US1 (um site publicado) e de a API estar respondendo.

**Independent Test**: Em produção, `GET /backend/health` devolve a resposta real da API (não o mock); emitir token, creditar e debitar um saldo funciona de ponta a ponta; chamadas a `/api/*` continuam sendo atendidas pelo MSW.

**Acceptance Scenarios**:

1. **Given** produção com mocks de backend desligados, **When** o front chama `/backend/health`, **Then** a requisição sai do navegador, passa pelo rewrite e é respondida pela API real.
2. **Given** a mesma configuração, **When** o front chama `/api/session`, **Then** quem responde é o MSW (o resto do produto segue em demonstração).
3. **Given** o ambiente de desenvolvimento e o de testes e2e, **When** o app roda, **Then** o `/backend/*` continua mockado por padrão — o Playwright nunca alcança a API real.
4. **Given** a API fora do ar ou respondendo erro, **When** o front chama `/backend/*`, **Then** o erro aparece como falha clara (sem simular sucesso e sem cair no mock).

---

### User Story 3 - Entrega endurecida e sem referências a localhost (Priority: P3)

O build de produção não contém dependências de infraestrutura local, expõe cabeçalhos de segurança e de cache adequados, e as funcionalidades que dependem de um back-end inexistente em produção (moedas da 006) ficam indisponíveis de forma explícita, em vez de quebrar.

**Why this priority**: Corrige riscos reais (o navegador do visitante chamando `localhost:4000`) e eleva a qualidade, mas só faz sentido depois de haver um site publicado (US1).

**Independent Test**: Inspecionar o bundle e as respostas HTTP de produção: nenhuma URL `localhost`; cabeçalhos presentes; a seção de saldo de moedas e a opção "pagar com moedas" não aparecem, e o checkout com carteira/ETH segue completo.

**Acceptance Scenarios**:

1. **Given** um build de produção sem URL do back-end de moedas configurada, **When** o visitante abre carteiras ou checkout, **Then** a seção de saldo de moedas e a opção de pagar com moedas não são exibidas e nenhuma requisição para `localhost` é feita.
2. **Given** o ambiente de desenvolvimento (padrão atual), **When** o app roda, **Then** o comportamento de moedas não muda (continua apontando para o `server/` local).
3. **Given** qualquer resposta de produção, **When** inspecionada, **Then** inclui cabeçalhos de segurança (tipo de conteúdo, referrer, frames, permissões) e a política de cache definida em US1.
4. **Given** o checkout, **When** o visitante paga com carteira/ETH em produção, **Then** o fluxo é idêntico ao do ambiente atual.

---

### User Story 4 - Publicação repetível e documentada (Priority: P4)

Qualquer pessoa da equipe consegue publicar o front-end (preview e produção) seguindo um procedimento documentado, com a matriz de variáveis de ambiente por ambiente, e validar o resultado com uma lista de verificação executável.

**Why this priority**: Consolida o que US1–US3 entregaram; é o que evita que a publicação dependa de conhecimento tácito.

**Independent Test**: Seguindo só o quickstart, uma pessoa nova vincula o projeto, configura as variáveis, publica um preview, valida e promove para produção.

**Acceptance Scenarios**:

1. **Given** o repositório, **When** alguém segue o quickstart, **Then** consegue publicar um preview do `apps/web` sem conhecimento prévio do projeto.
2. **Given** um build de produção, **When** `pnpm lighthouse` é rodado contra ele, **Then** a auditoria de desempenho e acessibilidade (constituição, Princípio VII) é executada e o resultado registrado.

---

### Edge Cases

- **API de produção ainda devolvendo `404`** (estado atual): US2 não pode ser dada como concluída; US1 e US3 não dependem dela e podem ser entregues antes.
- **Visitante com versão antiga do service worker em cache**: ao publicar nova versão, o `mockServiceWorker.js` não pode ficar preso em cache.
- **Variável de ambiente esquecida**: o build de produção MUST falhar ou degradar de forma explícita, nunca cair silenciosamente em `localhost`.
- **Previews apontando para a API de produção**: o rewrite usa um destino fixo; um preview do front usa a API de produção. Isso é aceito e documentado.
- **Preview protegido por autenticação da Vercel**: previews não são públicos por padrão; validações automatizadas contra eles precisam de acesso autenticado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O `apps/web` MUST ser publicado como um projeto Vercel próprio, com o monorepo pnpm instalado a partir da raiz, e MUST ter URL pública de produção.
- **FR-002**: O ambiente de produção MUST manter o MSW ligado para `/api/*` (o produto continua em demonstração, conforme o Princípio V) e MUST documentar isso como característica do ambiente, não como acidente.
- **FR-003**: Toda rota de navegação da SPA MUST responder pelo fallback para `index.html`; nenhuma URL profunda MAY devolver `404` da plataforma.
- **FR-004**: O `index.html` e o `mockServiceWorker.js` MUST ser servidos sem cache de longa duração; arquivos com hash em `/assets/*` MUST ser servidos com cache imutável de longa duração.
- **FR-005**: O mock do `/backend/*` MUST ser controlado por uma configuração própria, separada da que liga o MSW para `/api/*`; MUST ficar ligado por padrão em desenvolvimento e testes e2e, e desligado no ambiente de produção.
- **FR-006**: Em produção, `/backend/*` MUST ser encaminhado à API `apps/api` por rewrite de mesma origem (`/backend/:path*` → `/api/:path*`), declarado antes do fallback da SPA.
- **FR-007**: O build de produção MUST NOT conter referência a `localhost` em código de aplicação. A URL do back-end de moedas MUST deixar de ter valor padrão em builds de produção.
- **FR-008**: Quando o back-end de moedas não estiver configurado, a interface MUST ocultar a seção de saldo de moedas e a opção de pagar com moedas, e MUST NOT emitir requisição para ele; o pagamento com carteira/ETH MUST permanecer inalterado.
- **FR-009**: Em desenvolvimento e nos testes e2e, o comportamento de moedas e de `ledger` MUST permanecer o mesmo de hoje (nenhuma regressão nos testes existentes além dos snapshots já desatualizados).
- **FR-010**: As respostas de produção MUST incluir cabeçalhos de segurança: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, proteção contra incorporação em frames e uma `Content-Security-Policy` compatível com o MSW (service worker de mesma origem) e com a ligação ao `/backend`.
- **FR-011**: A matriz de variáveis de ambiente por ambiente (desenvolvimento, preview, produção) MUST estar documentada, com o significado e o valor esperado de cada uma.
- **FR-012**: O procedimento de publicação (vincular, configurar variáveis, publicar preview, validar, promover) MUST estar documentado e MUST incluir a verificação com `pnpm lighthouse` contra o build publicado.
- **FR-013**: A dependência de a API de produção responder corretamente MUST estar explícita como pré-requisito de US2, e o plano MUST NOT declarar US2 concluída enquanto `GET /backend/health` em produção não devolver `200` da API real.

### Key Entities

- **Ambiente**: uma das três situações de execução — desenvolvimento, preview, produção — cada uma com seu conjunto de variáveis (a matriz de configuração).
- **Matriz de configuração**: o conjunto de variáveis de ambiente com nome, ambiente, valor esperado e efeito no app (mocks de `/api`, mocks de `/backend`, caminho do back-end, URL de moedas).
- **Regra de entrega**: um par origem→comportamento HTTP (rewrite, fallback, cabeçalho, cache) declarado na configuração do projeto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das rotas de navegação principais (`/`, `/nft/:id`, `/cart`, `/checkout`, `/account/profile`, `/account/wallets`) respondem sem `404` quando abertas diretamente na URL de produção.
- **SC-002**: Em produção, `GET /backend/health` retorna `200` originado da API real (não do mock) e uma sequência token → crédito → débito → saldo fecha com os valores corretos.
- **SC-003**: O bundle de produção contém 0 endereços `localhost:<porta>` em código de aplicação, e uma sessão de navegação completa em produção emite 0 requisições HTTP para `localhost`. **Exceções conhecidas e justificadas** (descobertas na implementação, não suposição): (a) menções à palavra `localhost` em código de bibliotecas de terceiros (listas de sufixos do `cookie`, fallbacks do socket.io/axios/router usados como *base* de URL, internos do MSW) não são configuração da aplicação; (b) o padrão `ws://localhost/realtime` de `VITE_SOCKET_URL` é um identificador de rota do socket simulado; (c) o interceptador de WebSocket do MSW tenta também abrir uma conexão nativa para `ws://localhost/socket.io/` — comportamento **anterior a esta feature** (reproduz em dev); em produção a CSP (`connect-src 'self'`) bloqueia essa tentativa antes de alcançar a máquina do visitante, e o bloqueio aparece como erro de console. Corrigir isso exige mexer no cliente realtime (Princípio IV) e fica como pendência fora desta feature.
- **SC-004**: 100% das respostas de produção do `index.html` e do `mockServiceWorker.js` saem sem cache de longa duração, e 100% dos arquivos em `/assets/*` saem com cache imutável.
- **SC-005**: A suíte e2e existente continua com o mesmo resultado de antes desta feature (mesmos testes passando; os 6 snapshots de `checkout`/`wallets` já desatualizados seguem fora do escopo), e a auditoria `pnpm lighthouse` roda contra o build publicado com resultado registrado.
- **SC-006**: Uma pessoa que nunca publicou o projeto consegue, seguindo só o quickstart, ter um preview funcionando sem ajuda.

## Assumptions

- **Produção = demonstração com mocks**: não há, e esta feature não cria, back-end real para catálogo, autenticação, carrinho ou pedidos. Isso é a constituição (Princípio V), não uma limitação desta feature.
- **Moedas (006) ficam indisponíveis em produção**: o `server/` usa SQLite local e não é implantável na Vercel; migrá-lo para `apps/api` está explicitamente fora do escopo da 007 (FR-002 de lá) e desta. A interface de moedas some em produção em vez de quebrar. Reativá-la exige uma feature própria.
- **URL `*.vercel.app` basta**: domínio próprio, analytics e monitoramento estão fora do escopo.
- **Publicação inicial por CLI**: integração Git/CI (deploy automático a cada push) fica fora do escopo; o repositório não tem CI hoje e criá-la é outra feature.
- **O rewrite usa a URL fixa da API de produção**: o destino de `vercel.json` não aceita variáveis de ambiente. Mudar o domínio da API exige editar o arquivo e republicar.
- **A correção do deploy da API pertence à feature 007** (T022/T023). Esta feature só declara a dependência (FR-013) e a verifica.
- **Sem mudança em `apps/api` nem em `server/`**: esta feature só altera `apps/web`, sua configuração de publicação e sua documentação.
