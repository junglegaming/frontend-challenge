# Research: Monorepo na Vercel com Vercel Blob

## D1: Ferramenta de monorepo

**Decision**: pnpm workspaces (`pnpm-workspace.yaml`) como mecanismo de linking/instalação, com Nx
por cima para grafo de projetos, cache de tarefas e execução escopada por app.

**Rationale**: o usuário pediu explicitamente os dois juntos ("pnpm workspaces simples e nx"). pnpm
já é o gerenciador de pacotes do projeto (sem mudança aí); Nx adiciona exatamente o que falta hoje
— rodar/cachear build/typecheck/lint por projeto (`apps/web` vs `apps/api`) sem acoplar um ao outro,
o que pnpm sozinho não oferece.

**Alternatives considered**:
- *Somente pnpm workspaces, sem orquestrador*: mais simples, zero config nova, mas sem grafo de
  tarefas/cache — rodar "só o typecheck do backend" viraria um script manual por pasta, e não
  atenderia FR-004/SC-005 (Nx escopando build/typecheck/lint por projeto).
- *Turborepo em vez de Nx*: solução equivalente em espírito, mas não foi o que o usuário pediu.

## D2: Layout do workspace

**Decision**: `apps/web` (SPA React existente, movida sem mudança de comportamento) + `apps/api`
(backend novo). Sem `packages/*` compartilhado nesta feature.

**Rationale**: os dois apps rodam em runtimes diferentes (browser vs. Serverless Function) e hoje
não compartilham nenhum código — introduzir um `packages/shared-*` agora seria especulativo (YAGNI).
A migração de `apps/web` é puramente estrutural (mover pastas, ajustar paths de config), não deve
mudar nenhum comportamento observável; isso é o que SC-004 verifica.

**Alternatives considered**:
- *Manter o frontend na raiz e só adicionar `apps/api` ao lado*: evitaria a migração, mas quebraria
  a simetria que Nx espera (um workspace Nx trata a raiz como não-app) e deixaria o "ambiente de
  monorepo" pela metade, que foi exatamente o que o usuário pediu para montar.
- *Criar `packages/shared-types` já de início*: rejeitado por não haver nenhum tipo hoje que
  realmente precise ser compartilhado entre `apps/web` e `apps/api` — pode ser adicionado depois sem
  retrabalho caso surja a necessidade real.

## D3: Runtime das rotas do backend

**Decision** *(revisado — o usuário pediu explicitamente Express no back-end)*: um único app
**Express** (`apps/api/src/app.ts`) concentra todas as rotas, montado atrás de **uma** Vercel
Serverless Function catch-all (`apps/api/api/index.ts`, que apenas importa e exporta o app Express),
com `vercel.json` reescrevendo todo `/api/*` para essa function.

**Rationale**: pedido explícito do usuário nesta sessão. Além disso, Express já é o framework usado
em `server/` (exceção 1.1.0) — reaproveitar o mesmo framework em `apps/api` significa o mesmo padrão
de middleware/roteador/tratamento de erro em ambos os backends do projeto, reduzindo a carga
cognitiva de manter dois estilos de backend diferentes. Um app Express é diretamente compatível com
o modelo `(req, res)` que a Vercel espera de uma function Node.js — não precisa de nenhum adaptador.

**Alternatives considered**:
- *Uma função por rota (`api/coins/balance.ts`, etc.), sem Express*: era a decisão original deste
  research antes da revisão — mais "nativo" ao modelo da Vercel (roteamento por arquivo, cold start
  mínimo por rota), mas foi substituída a pedido explícito do usuário por Express.
- *Edge Runtime*: mais rápido para respostas simples, mas tem restrições de API (sem alguns módulos
  Node, e Express não roda no runtime Edge) — incompatível com a decisão de usar Express; rejeitado.

## D4: Estrutura interna do app Express

**Decision**: `apps/api/src/app.ts` monta o Express (`cors`, parser JSON, roteador) e registra um
`express.Router()` por recurso (`apps/api/src/routes/coins.ts` para `/coins/balance|topup|debit|
transactions`, `apps/api/src/routes/health.ts` para `/health`). Os handlers das rotas delegam para
`src/domains/coins/service.ts` (lógica de negócio) e `src/lib/*` (storage no Blob, identidade,
erros) — o Express cuida só de transporte (parsing, roteamento, middleware de erro), igual ao padrão
já usado em `server/src/app.ts`. `apps/api/api/index.ts` é o único arquivo que a Vercel enxerga como
function: `import app from "../src/app"; export default app;`.

**Rationale**: mantém a separação transporte/negócio que o resto do projeto já segue, e espelha
literalmente a estrutura de `server/` (mesma forma de organizar `app.ts`/`routes/`/`middleware/`),
facilitando para quem já conhece um backend entender o outro.

**Alternatives considered**: lógica de negócio direto nos handlers Express (mistura transporte e
regra de negócio) — rejeitado pela mesma razão que já vale para `server/`: dificulta testar a lógica
isoladamente do HTTP.

## D5: Concorrência otimista sobre Vercel Blob

**Decision**: cada registro de saldo (`coins/balances/<ownerId>.json`) carrega um campo `version`
(inteiro, incrementado a cada escrita). Uma escrita (top-up/debit) faz: (1) `get` do blob atual, (2)
calcula o novo valor e `version + 1`, (3) `put` sobrescrevendo o mesmo path. Antes do passo 3, o
serviço relê o blob (double-check) e, se o `version` lido divergir do que foi lido no passo 1, a
escrita é rejeitada com 409 e o chamador deve tentar de novo (reler saldo, reaplicar operação).

**Rationale**: Vercel Blob não tem compare-and-swap nem transações — isto é o máximo de segurança
que dá para construir sem sair do Blob. O double-check antes do `put` reduz (mas não elimina) a
janela de corrida entre o `get` inicial e o `put` final, exatamente a limitação que a spec documenta
em FR-008/FR-009 como aceita, não resolvida.

**Alternatives considered**:
- *Vercel KV (Redis) com `INCR` atômico*: resolveria corretamente e sem essa limitação — foi
  recomendado e explicitamente preterido pelo usuário em favor de Blob para tudo (ver spec,
  Assumptions). Registrado aqui como a opção "se isto precisar virar produção de verdade".
- *Nenhum controle de concorrência*: mais simples, mas viola diretamente o Acceptance Scenario 3 da
  User Story 3 (atualização perdida silenciosamente) — inaceitável mesmo em escala de demo.

## D6: Convenção de paths no Blob

**Decision**: saldo em `coins/balances/<ownerId>.json` (um arquivo, sobrescrito a cada mudança);
cada transação em `coins/transactions/<ownerId>/<ISO-timestamp>-<txId>.json` (um arquivo novo por
transação, nunca sobrescrito). Histórico é reconstruído com `list({ prefix: "coins/transactions/<ownerId>/" })`
ordenado pela chave (o timestamp ISO no nome garante ordem lexicográfica = ordem cronológica).

**Rationale**: separar "estado atual" (1 arquivo, sofre concorrência) de "histórico" (append-only,
sem concorrência — cada transação é uma chave nova, nunca colide) minimiza a superfície onde D5
precisa se aplicar. Também evita reescrever um array crescente inteiro a cada transação.

**Alternatives considered**: um único JSON por usuário com um array de transações embutido —
rejeitado por crescer sem limite e por exigir um read-modify-write do arquivo inteiro a cada
transação, ampliando desnecessariamente a janela de corrida que D5 já tenta minimizar.

## D7: Topologia de deploy na Vercel

**Decision**: dois projetos Vercel separados, um por app (`apps/web`, `apps/api`), cada um linkado
(`vercel link`) à sua própria pasta, com seu próprio `vercel.json` e suas próprias env vars.

**Rationale**: a detecção automática de framework da Vercel é por projeto; forçar os dois apps em um
projeto só exigiria configuração manual de rewrites/functions que a Vercel já resolveria sozinha com
dois projetos. Também respeita FR-004/SC-005 (build/deploy independentes) — um deploy do backend não
aciona nem depende do deploy do frontend.

**Alternatives considered**: um único projeto Vercel com `apps/web` como build estático e
`apps/api/api/**` mapeado via `functions`/`rewrites` no `vercel.json` raiz — tecnicamente possível,
mas adiciona configuração manual sem necessidade e acopla os dois deploys.

## D8: Emulação local

**Decision**: `vercel dev` rodado a partir de `apps/api` é o jeito **principal** e exigido para
validar paridade local/produção (SC-002) — ele invoca o mesmo app Express através da mesma function
catch-all que roda em produção, incluindo o rewrite `/api/*` do `vercel.json`. `apps/api/src/server.ts`
existe apenas como um `app.listen` opcional, só para quem quiser rodar o Express puro (sem a camada
da Vercel) durante o desenvolvimento do próprio app — ele MUST NOT ser usado para validar SC-002,
já que pula o rewrite e o modelo de invocação reais da Vercel. `apps/web` continua com `vite`
normalmente. Um script raiz (seguindo o padrão `concurrently` já usado em `dev:all`) sobe `vite` e
`vercel dev` juntos.

**Rationale**: `vercel dev` é o único jeito de testar o comportamento real da Vercel (rewrite,
roteamento, variáveis de ambiente de produção) sem fazer deploy a cada mudança. O `server.ts` opcional
só existe pelo mesmo motivo que `server/` (006) tem o seu: um loop de desenvolvimento rápido do
Express em si, sem esperar o `vercel dev` subir — mas nunca como substituto da validação via
`vercel dev` antes de um deploy.

**Alternatives considered**: usar só `apps/api/src/server.ts` (Express puro) como ambiente de
desenvolvimento local, sem `vercel dev` — rejeitado como único mecanismo porque divergiria do
comportamento real da Vercel em produção (sem o rewrite, sem o modelo de invocação serverless), o
oposto do que SC-002 pede; por isso ele é mantido só como atalho opcional, nunca como substituto.

## D9: Integração do Nx sem reescrever `apps/web`

**Decision**: `nx init`/config manual mínima — `nx.json` na raiz + um `project.json` (ou plugin
inferido, ex. `@nx/vite`) por app, reconhecendo os projetos e seus alvos (`build`, `typecheck`,
`lint`, `dev`) sem usar geradores que reescrevam a estrutura interna de `apps/web`.

**Rationale**: `apps/web` é um app Vite+React já existente sendo relocado, não gerado do zero —
geradores padrão do Nx assumem um scaffold novo e reescreveriam arquivos de configuração que já
funcionam. Configuração manual/inferida preserva o comportamento exigido por SC-004.

**Alternatives considered**: `nx g @nx/react:app` para recriar `apps/web` do zero e portar o código
para dentro — mais "idiomático" para um workspace Nx greenfield, mas arriscado demais para um app já
em produção com testes E2E e configuração própria (Tailwind v4, TanStack Router plugin, MSW worker);
rejeitado por risco desnecessário frente ao ganho.

## D10: Autenticação por token assinado nas rotas de `/coins/*`

**Decision**: `apps/api` emite e verifica **JWT** (`jsonwebtoken`, HS256, segredo em
`AUTH_JWT_SECRET`) escopados a um único `ownerId`, com expiração curta (15 min). `POST /auth/token`
recebe `{ ownerId }` e devolve `{ token, expiresAt }`. Um middleware `requireAuth`
(`src/lib/auth.ts`) roda antes de todo router de `/coins/*`: extrai `Authorization: Bearer <token>`,
verifica assinatura e expiração, e injeta o `ownerId` (vindo só da claim `sub` do token) no request —
qualquer outro id que a requisição tente informar (header, query, body) é ignorado pelos handlers,
que só leem o `ownerId` que o middleware colocou.

**Rationale**: pedido explícito do usuário ("colocar uma forma de segurança para ninguém conseguir
invadir sessão do outro"). JWT com HS256 é a opção mais simples que ainda dá verificação
criptográfica real (sem precisar de um serviço de auth externo ou de chave assimétrica, desnecessários
nesta escala); `jsonwebtoken` é a biblioteca mais madura/conhecida do ecossistema Node para isso.
Expiração curta limita a janela de um token vazado. Isto fecha o vetor "troquei um header e virei
outro usuário" que existiria se `apps/api` confiasse direto em `x-owner-id` como o `server/` da 006
faz.

**Limitação explícita, não resolvida por este design**: `POST /auth/token` continua confiando no
`ownerId` que lhe é pedido — não há senha nem prova de identidade na emissão, porque o projeto
inteiro não tem login real em nenhum lugar. Isso significa que quem já souber o id de outro usuário
ainda pode pedir um token para esse id diretamente no endpoint de emissão. O que este design
realmente impede é: (a) uma requisição conseguir agir como outro dono só trocando um valor de header
depois que um token já foi emitido para alguém, e (b) um token expirado ou adulterado ser aceito.
Fechar a lacuna de "a emissão em si confia cegamente" exigiria login/senha reais em todo o produto —
fora do escopo desta feature de infraestrutura, e documentado como tal na spec (Assumptions) e no
README de `apps/api`.

**Alternatives considered**:
- *Continuar confiando em `x-owner-id` sem verificação (igual ao `server/` da 006)*: era o design
  original deste plano antes do pedido explícito de autenticação; rejeitado porque não atende ao
  requisito de segurança pedido pelo usuário nesta rodada.
- *Sessão com cookie + store server-side*: exigiria um lugar para guardar sessões (voltando a
  precisar de um banco ou de um Blob adicional só para isso) — mais pesado que tokens stateless sem
  ganho real nesta escala.
- *JWT assimétrico (RS256) com rotação de chaves*: resolve o mesmo problema com mais robustez
  operacional (rotação, múltiplos verificadores), mas é complexidade desnecessária para um único
  serviço que assina e verifica seus próprios tokens — rejeitado por excesso de engenharia frente ao
  escopo.
