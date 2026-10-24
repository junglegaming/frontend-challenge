<!--
Sync Impact Report
- Version change: 1.1.0 → 1.2.0 → 1.2.1 → 1.3.0 → 1.4.0 → 1.5.0 → 1.6.0 → 1.7.0 → 1.8.0
- Modified principles: nenhum (nenhum princípio existente foi removido ou redefinido de forma
  incompatível; a mudança abaixo é uma segunda exceção aditiva, escopada a um workspace novo
  `apps/api` + `apps/web`, sem alterar `server/`, a exceção de 1.1.0, nem o restante de `src/`)
- Added sections: "Exceção Pontual: Monorepo na Vercel com Vercel Blob (`apps/web`, `apps/api`)"
- 1.2.1: esclarecimento aditivo dentro da mesma seção — stack explícita de `apps/api` passa a citar
  Express (pedido explícito do usuário para o plano da 007), em vez de ficar implícita
- 1.3.0: o modelo de identidade de `apps/api` muda de "confia cegamente no id enviado" para "token
  assinado e verificado (JWT) por requisição, derivado só do token" — uma mudança material de
  comportamento (não só de redação), por isso MINOR em vez de PATCH; a limitação de que a emissão do
  token ainda confia no id pedido (sem login real) permanece e fica documentada explicitamente
- 1.4.0: `apps/api` ganha login real **apenas para administradores** (e-mail + senha com hash scrypt,
  token JWT com `role: "admin"`) e rotas `/admin/*` somente leitura; ampliação do modelo de identidade da
  exceção 1.3.0 por pedido explícito do usuário; os donos de saldo continuam sem login real
- 1.5.0: `apps/api` passa a poder usar **Postgres no Neon** (`@neondatabase/serverless`) e migrar saldo,
  transações e administradores do Blob para ele — revoga a frase "nenhum driver de banco relacional" da
  1.2.0 e a decisão de "Blob para tudo" da spec 007 (FR-007), por pedido explícito do usuário, porque o
  Blob não tem transações (SC-003 não é atendido) nem armazenamento privado
- 1.6.0: `apps/api` passa a acessar o Postgres pelo **Prisma ORM** (`@prisma/client`, `prisma`,
  `@prisma/adapter-neon` sobre `@neondatabase/serverless`), com esquema e migrações em
  `apps/api/prisma/` (Prisma Migrate) — revoga "acessado só por `@neondatabase/serverless`; nenhum ORM"
  da 1.5.0, por pedido explícito do usuário (plano da 010, revisão 3). SQL cru fica restrito a
  `$queryRaw` parametrizado (as variantes `Unsafe` são proibidas) e `DATABASE_URL_UNPOOLED` (usada só
  pelo Migrate) entra na regra de "só em variável de ambiente". MINOR: expansão material da stack
  permitida, sem remover nem redefinir princípio; o restante da exceção fica literalmente igual
- 1.7.0: Atividade, Ofertas e Arquivos baixados saem de "Fora de escopo" e entram como escopo simulado
  (MSW), com regras mínimas de cada um; entram também os pedidos no admin do marketplace (somente
  leitura) e a tela do admin real das moedas (somente leitura, `/backend/admin/*`, token separado da
  sessão do site e nunca em `localStorage`). Suporte e páginas editoriais continuam fora. Pedido
  explícito do usuário (plano de 2026-10-24: features 012–016). MINOR: expansão material de escopo, sem
  remover nem redefinir princípio
- 1.8.0: Suporte (FAQ e chamados: abrir, ver, responder) sai de "Fora de escopo". Favoritos, compras
  confirmadas, ofertas, downloads, atividade e suporte passam a ter backend real em `apps/api`
  (Postgres/Prisma, `requireAuth`; decisão de ofertas e resposta de chamados em rotas `/admin/*` com
  `requireAdmin`), revogando o "sempre simulado no MSW" da 1.7.0 para esses recursos. Atividade é consulta
  derivada, sem tabela de eventos. Limitação registrada: a API confia no registro de compra enviado pelo
  web, porque pedidos e catálogo continuam no MSW. "Lista de interesse" é a página dos Favoritos. Pedido
  explícito do usuário (plano de 2026-10-24). MINOR: expansão material de escopo e da exceção de
  `apps/api`, sem remover nem redefinir princípio
- Modified sections: "Restrições Técnicas e de Escopo" (itens "Fora de escopo", "Escopo ampliado (1.7.0)" e
  "Segurança"; novo item "Escopo ampliado (1.8.0)"); "Exceção Pontual: Monorepo na Vercel..." (novo item
  de domínios da conta e limitação de confiança)
- Templates/commands: nenhum alterado (leem a constituição em tempo de execução)
- Removed sections: nenhum
- Follow-up TODOs: atualizar `docs/CHALLENGE.md` (linha 48 ainda lista atividade, ofertas e downloads
  como fora da entrega, e suporte continua listado como fora); este comando só altera a constituição,
  então a edição fica para a primeira feature desta leva
-->
# NFT Marketplace Constitution

## Core Principles

### I. Arquitetura em Camadas e Fronteiras de Dependência (NON-NEGOTIABLE)
O código MUST seguir o fluxo `app/routes → pages → domains → shared`, conforme `docs/TEAMS.md`.
- Uma página MUST NOT importar outra página; código usado por duas páginas sobe para um domínio
  ou para `shared/ui`.
- Páginas e rotas MUST importar domínios apenas pela API pública (`@/domains/<domínio>`).
- Rotas MUST importar páginas apenas por `@/pages/<página>`.
- `shared/` MUST NOT importar `app/`, `pages/` nem `domains/`.
- Cada tela MUST ter uma pasta própria em `src/pages/<página>` com README (escopo, rota, domínios).

Justificativa: times diferentes são donos de páginas diferentes; as fronteiras evitam acoplamento
e são verificadas mecanicamente por `pnpm lint`.

### II. Tipagem Estrita e Contratos Explícitos
Contratos (DTOs) MUST ser tipados entre transporte, estado e interface, e viver em
`domains/<domínio>/model`, sem React e sem Axios. `any` é proibido (use `unknown` com narrowing,
genéricos ou tipos dos contratos). Dados externos MUST ser validados na borda (Zod). Valores em ETH
MUST trafegar como strings decimais e ser calculados com `decimal.js`; quantidades são inteiras.

Justificativa: precisão monetária e segurança de tipos são requisitos do domínio.

### III. Estado Remoto Disciplinado
Toda chamada REST MUST passar pelo cliente Axios e todo estado remoto MUST ser gerido pelo
TanStack Query, com query keys isoladas por usuário e por parâmetros. Filtros, busca, ordenação e
paginação MUST viver na URL (TanStack Router). Interações com mutation MUST tratar estados de
carregamento, vazio, erro, sucesso e atualização em segundo plano; respostas obsoletas MUST ser
canceladas ou descartadas. Operações de pedido MUST usar chave de idempotência. Pelo menos uma
interação MUST usar atualização otimista com rollback. Política de cache, retries e sincronização
MUST ser documentada.

### IV. Tempo Real Confiável
Eventos Socket.IO (`nft.updated`, `order.updated`) MUST carregar identidade estável, recurso e
versão; o cliente MUST tolerar duplicatas e eventos antigos sem regredir estado. Após reconexão, os
recursos ativos MUST ser reconciliados via REST. Listeners MUST ser liberados no fim do ciclo de
vida, e eventos de uma sessão anterior MUST NOT afetar outro usuário. Logout e troca de usuário MUST
limpar caches privados e subscriptions.

### V. Mocks Apenas na Camada de Rede
Toda simulação MUST residir em `src/mocks` (MSW, incluindo Socket.IO via
`@mswjs/socket.io-binding`). Componentes, hooks e o cliente Axios MUST NOT conter dados fictícios
nem caminhos de negócio alternativos. Cenários MUST ser determinísticos, configuráveis, reproduzíveis
e consistentes entre REST e eventos; o reset MUST restaurar um cenário conhecido.

### VI. Acessibilidade, Responsividade e Fidelidade Visual (NON-NEGOTIABLE)
Todas as telas MUST funcionar em 390, 768 e 1440 px, sem overflow horizontal indevido. Navegação
por teclado, foco visível, controle de foco em diálogos/drawers, labels e erros associados aos
campos, alternativas textuais e feedback acessível (mutations e tempo real) são obrigatórios.
Estados de carregamento MUST usar skeletons com shimmer que preservem dimensões e respeitem
`prefers-reduced-motion`. Componentes `src/shared/ui/*` MUST vir da CLI do shadcn/ui e ser
adaptados via tema (`src/index.css`), não reescritos. A identidade visual do Figma MUST ser
preservada.

### VII. Verificação por Testes e Auditoria
Fluxos críticos MUST ter testes E2E Playwright executados contra os mocks (uma pasta por página em
`e2e/`), incluindo regressão visual. Cenários de falha (rede, 4xx/5xx, sessão expirada, cupom
inválido, preço alterado, timeout com recuperação idempotente) MUST ser cobertos. Mudanças MUST
manter `pnpm lint`, `pnpm typecheck` e `pnpm build` verdes, e o desempenho/qualidade MUST ser
auditado com Lighthouse (`pnpm lighthouse`).

## Restrições Técnicas e de Escopo

- Stack obrigatória: React, TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO,
  Tailwind CSS, shadcn/ui, MSW, Playwright e Lighthouse. Cada tecnologia MUST participar
  efetivamente da solução.
- Gerenciador de pacotes: pnpm. Linter: oxlint (`.oxlintrc.json` codifica as regras de fronteira).
- Fora de escopo: integrações reais de blockchain, extensões de carteira e gateways de pagamento;
  páginas editoriais. Ações fora do escopo MUST NOT aparentar sucesso funcional.
- Escopo ampliado (1.7.0), simulado no MSW (Princípio V), sem integração real nova. Para Atividade,
  Ofertas e Arquivos baixados, o "simulado no MSW" é substituído pelo backend real de `apps/api` descrito
  em "Escopo ampliado (1.8.0)"; as regras de comportamento de cada item continuam valendo:
  - **Atividade**: feed somente leitura do próprio usuário, derivado de dados que já existem (pedidos,
    ofertas, favoritos, moedas); MUST NOT inventar eventos que não aconteceram no cenário simulado.
  - **Ofertas**: o colecionador faz uma oferta de preço num NFT; o vendedor aceita ou recusa; cada oferta
    tem status explícito. Aceitar uma oferta MUST NOT aparentar liquidação real (é a simulação de pedido
    já existente, com chave de idempotência, Princípio III).
  - **Arquivos baixados**: só dos NFTs com pedido confirmado do próprio usuário.
  - **Pedidos no admin do marketplace**: listar os pedidos de todos os usuários e ver o detalhe, somente
    leitura, exigindo `role: "admin"` da sessão do site.
  - **Tela do admin real das moedas** (`apps/api`, exceção 1.4.0): somente leitura, pelo caminho
    `/backend/admin/*`. O token de admin da API MUST NOT ser confundido com a sessão do site (papéis e
    sessões separados) e MUST NOT ser persistido em `localStorage`.
- Escopo ampliado (1.8.0), com backend real em `apps/api` (exceção abaixo) acessado pelo web em `/backend`:
  - **Lista de interesse**: é a página dos Favoritos (`/account/wishlist`); não existe um segundo modelo.
    Os favoritos passam a ser guardados em `apps/api`, por dono, como `nftId`.
  - **Compras confirmadas**: `apps/api` guarda um registro por pedido confirmado (snapshot imutável das
    linhas), enviado pelo web e gravado de forma idempotente pelo id do pedido. Limitação assumida: pedidos
    e catálogo continuam no MSW, então a API MUST NOT ser apresentada como verificadora do pedido; ela
    confia no registro enviado pelo web, como a emissão do token já confia no id pedido. Documentar no
    README de `apps/api` e na spec.
  - **Arquivos baixados**: só a partir de compras confirmadas do próprio dono; o arquivo é simulado (sem
    arquivo real no servidor).
  - **Atividade**: MUST ser uma consulta derivada de dados existentes (compras, ofertas, favoritos,
    moedas), sem tabela de eventos própria, para não inventar eventos.
  - **Ofertas**: guardadas em `apps/api`, com status explícito e chave de idempotência por dono. A decisão
    (aceitar ou recusar) é feita por rota `/admin/*` com `requireAdmin`; aceitar MUST NOT aparentar
    liquidação real.
  - **Suporte**: FAQ e chamados (abrir, ver e responder), guardados em `apps/api` por dono. A resposta do
    atendimento é feita por rota `/admin/*` com `requireAdmin`. O dono MUST NOT ler chamado de outro dono.
- Segurança: credenciais fictícias apenas (exceto o admin real de `apps/api`, regido pela exceção
  1.4.0); senhas MUST NOT ser armazenadas em claro; checkout, perfil, carteiras, favoritos, pedidos,
  atividade, ofertas, arquivos baixados e suporte exigem autenticação.
- Recibos MUST reproduzir o snapshot do pedido, imutável a mudanças posteriores no catálogo.

## Exceção Pontual: Backend Real de Moedas da Plataforma (`server/`)

Esta seção abre uma exceção explícita, aditiva e escopada ao Princípio V e à tabela de "Stack
obrigatória" acima — que continuam valendo integralmente para tudo dentro de `src/` (a SPA React).
Nada no restante da constituição muda; esta exceção existe apenas para a feature de "moedas da
plataforma" (coins), uma moeda nativa alternativa ao fluxo de pagamento via carteira/ETH já
existente, que o time decidiu implementar com persistência real em vez de simulada.

- Um novo diretório de nível raiz `server/` é permitido como um serviço de backend **real**,
  adicional e independente — com seu próprio `package.json`/stack, deliberadamente **não**
  integrado ao workspace pnpm do frontend — usado exclusivamente para o saldo de moedas, o
  top-up simulado (compra de moedas) e o débito/estorno de moedas no checkout.
- `server/` é explicitamente isento da regra "toda simulação MUST residir em `src/mocks`"
  (Princípio V): ele não é uma simulação, é um backend de verdade com persistência real via SQLite
  (ex.: `better-sqlite3`).
- Stack permitida dentro de `server/`, e apenas dentro dele: Node.js, TypeScript, Express
  (escolhido deliberadamente por simplicidade — NestJS ou outro framework mais pesado MUST NOT ser
  usado aqui), um driver SQLite, e bibliotecas mínimas de apoio (ex. `cors`, `zod` para validação).
  Ferramentas de monorepo (Nx, Turborepo ou equivalentes) MUST NOT ser introduzidas só por causa
  deste diretório.
- Modelo de identidade: como o projeto não tem autenticação real (login/sessão continuam
  inteiramente simulados no frontend via MSW, sem mudança), o backend de moedas confia no id de
  usuário que o frontend envia (ex. via header), sem validá-lo contra nenhuma autoridade real. Isso
  é uma simplificação assumida, aceitável apenas por não envolver dinheiro real nem dados sensíveis
  reais, e MUST ficar documentada como limitação conhecida (no README do `server/` e na spec da
  feature), nunca escondida ou apresentada como um modelo de segurança real.
- Os testes Playwright/e2e do projeto MUST continuar rodando inteiramente contra os mocks
  existentes (MSW/`src/mocks`) — `server/` não entra no fluxo de testes determinístico padrão
  (Princípio VII) e precisa de sua própria estratégia de verificação, documentada separadamente.
- Qualquer expansão futura desta exceção (ex.: mover mais funcionalidades para um backend real)
  exige uma nova emenda explícita a esta constituição, não uma extensão silenciosa do escopo aqui
  definido.

## Exceção Pontual: Monorepo na Vercel com Vercel Blob (`apps/web`, `apps/api`)

Esta seção abre uma segunda exceção explícita, aditiva e escopada — independente da exceção de
`server/` acima, que continua valendo exatamente como está. Nada nela muda; esta nova seção existe
apenas para a feature `007-monorepo-vercel-blob`, que reestrutura o repositório em um workspace
pnpm + Nx e introduz um novo backend (`apps/api`) implantado na Vercel, usando Vercel Blob como
armazenamento.

- O repositório raiz pode ser reorganizado em um workspace pnpm (`pnpm-workspace.yaml`) com Nx por
  cima para orquestração de tarefas/cache/grafo de projetos — isto é permitido **apenas** para esta
  reestruturação (`apps/web`, `apps/api`, `packages/*` que vierem a existir); pnpm continua sendo o
  gerenciador de pacotes, Nx é aditivo, não substitui o pnpm.
- `apps/web` é a SPA React existente, movida sem mudança de comportamento; todos os Princípios I-VII
  continuam valendo integralmente dentro dela, sem exceção.
- `apps/api` é um novo backend real, implantado como Vercel Serverless Functions, isento da regra
  "toda simulação MUST residir em `src/mocks`" (Princípio V) pelo mesmo motivo que `server/` já é:
  não é uma simulação.
- Stack permitida dentro de `apps/api`: Node.js, TypeScript, **Express** (mesmo framework já usado
  em `server/`, montado atrás de uma única Vercel Function catch-all), `cors`, `zod`, o SDK
  `@vercel/blob`, e uma biblioteca de JWT (ex. `jsonwebtoken`) para o modelo de identidade abaixo.
  Persistência de dados sensíveis/estruturados (1.5.0, revista em 1.6.0): **Postgres no Neon**,
  acessado pelo **Prisma ORM** (`@prisma/client`, `prisma`) com o adaptador `@prisma/adapter-neon` sobre
  `@neondatabase/serverless`; nenhum outro ORM, driver ou banco. Esquema e migrações MUST viver em
  `apps/api/prisma/` (Prisma Migrate). SQL cru só por *tagged template* parametrizado (`$queryRaw`),
  nunca pelas variantes `Unsafe` (`$queryRawUnsafe`, `$executeRawUnsafe`). As strings de conexão
  (`DATABASE_URL` e `DATABASE_URL_UNPOOLED`) MUST viver só em variável de ambiente, nunca em arquivo do
  repositório, log ou resposta da API.
- `apps/api` persiste dados via **Vercel Blob**, incluindo dados estruturados (saldo e histórico de
  transações do recurso de exemplo) — uma escolha deliberada, feita cientes de que Blob não tem
  transações nem locks nativos; a mitigação exigida é controle de concorrência otimista (ler versão
  atual, escrever nova versão, rejeitar/repetir em conflito), documentada como limitação aceita e
  nunca apresentada como consistência transacional real.
- Migração Blob → Postgres (1.5.0): saldo, transações e administradores de `apps/api` passam a ser
  guardados no Postgres, onde o controle de concorrência é feito pelo banco (ex. `UPDATE ... WHERE
  amount >= $1` atômico, em vez da concorrência otimista sobre Blob) e o armazenamento deixa de ser
  público. Enquanto algum dado ainda estiver no Blob, valem para ele as exigências acima (mitigação de
  concorrência documentada e a divulgação de que o Blob não é armazenamento privado). O Blob continua
  permitido para arquivos não sensíveis. A migração MUST ser testada de ponta a ponta antes de o Blob
  deixar de ser usado para esses dados, e `server/` (006) continua intocado.
- `server/` (a exceção de 1.1.0, usada por `006-platform-coins`) MUST NOT ser modificado, movido ou
  substituído por esta exceção — as duas coexistem; reconciliar/aposentar `server/` em favor de
  `apps/api` é trabalho futuro fora do escopo desta emenda.
- Administradores (1.4.0): `apps/api` autentica administradores com e-mail e senha de verdade. A senha MUST ser
  guardada só como hash salgado (scrypt), nunca em claro, nunca em arquivo do repositório nem em log; o
  cadastro inicial é feito por script que lê as credenciais do ambiente. O token de admin carrega
  `role: "admin"`, é emitido somente por `POST /admin/login`, e MUST NOT ser aceito nas rotas de dono (nem o
  inverso). Falha de login MUST ser indistinguível entre e-mail desconhecido e senha errada. As rotas
  `/admin/*` são somente leitura; escrita/ajuste de saldo por admin segue fora de escopo. Limitação
  assumida: o Vercel Blob só serve objetos por URL pública, então o hash fica em armazenamento não privado
  (ver `apps/api/README.md`).
- Modelo de identidade dos donos (revisado): diferente de `server/` (que confia direto no id recebido),
  `apps/api` exige um token assinado (JWT, segredo em variável de ambiente, expiração curta) em
  todas as rotas de `/coins/*`; o id do dono da requisição MUST vir exclusivamente da claim do token
  verificado, nunca de um header/body alternativo. A rota de emissão do token
  (`POST /api/auth/token`) continua confiando no id que lhe é pedido — isto não introduz login/senha
  real ao produto — e essa limitação específica (emissão confia, uso subsequente não) MUST ficar
  documentada de forma explícita no README de `apps/api` e na spec da 007, nunca apresentada como
  proteção completa contra uso indevido de conta.
- Domínios da conta (1.8.0): `apps/api` ganha os domínios `favorites`, `purchases`, `offers`, `activity`,
  `downloads` e `support`, no mesmo Postgres/Prisma e com o mesmo padrão dos domínios existentes. As rotas
  de dono ficam atrás de `requireAuth` e o `ownerId` MUST vir só do token verificado, nunca do corpo; as
  rotas de decisão de ofertas e de resposta de chamados ficam em `/admin/*` com `requireAdmin`, e as
  escritas de admin que isto cria são limitadas a essas duas (o ajuste de saldo por admin segue fora de
  escopo). Valores em ETH MUST trafegar como string decimal. Mudanças de esquema MUST entrar por migração
  do Prisma Migrate.
- O Playwright/e2e existente MUST continuar rodando inteiramente contra os mocks do frontend; não é
  apontado para `apps/api` (para os domínios da conta, o web usa handlers MSW de `/backend`).
  `apps/api` precisa de sua própria estratégia de verificação.
- Qualquer expansão futura desta exceção exige nova emenda explícita a esta constituição.

## Fluxo de Desenvolvimento e Qualidade

- Cada mudança segue o fluxo Spec Kit: especificação → plano → tarefas → implementação.
- Todo PR MUST passar em lint, typecheck e build, e ser revisado quanto à conformidade com esta
  constituição; desvios MUST ser justificados no plano (seção de complexidade).
- Mudanças de comportamento visível MUST atualizar ou adicionar testes E2E e snapshots visuais.
- Commits MUST ser pequenos e descritivos, seguindo o padrão já usado no repositório
  (ex.: `feat(...)`, `refactor:`, `chore(...)`).
- Mudanças de estrutura MUST atualizar `docs/TEAMS.md` e o README da página afetada.

## Governance

Esta constituição prevalece sobre outras práticas do projeto. Emendas MUST ser propostas por PR
que atualize este arquivo, descreva a motivação e o impacto, inclua plano de migração quando houver
quebra, e seja aprovado por pelo menos um responsável de time. Versionamento semântico:
MAJOR para remoção ou redefinição incompatível de princípios; MINOR para novo princípio/seção ou
expansão material; PATCH para esclarecimentos e correções de redação. Revisões de código e
`/speckit-analyze` MUST verificar conformidade; regras de fronteira (Princípio I) são impostas
automaticamente por `pnpm lint`. Orientação de uso diário: `docs/TEAMS.md` e `docs/CHALLENGE.md`.

**Version**: 1.8.0 | **Ratified**: 2026-10-14 | **Last Amended**: 2026-10-24
