# Research: Admin Console — Products, Users & AI Image Generator

## D1 — Papel do administrador: campo obrigatório vs. opcional

**Decisão**: `role: 'collector' | 'admin'` é um campo **obrigatório** (não opcional) em
`SessionUser` e em `UserRecord`. `usr_ana` (fixture já existente, usada em praticamente todos os
testes e2e de hoje) é seedada como `'admin'`; `usr_bruno` e qualquer conta criada via signup são
`'collector'`.

**Razão**: tornar o campo obrigatório força toda leitura de `SessionUser` a decidir
conscientemente o que fazer com o papel, em vez de tratar `undefined` como "não-admin" por
acidente — mais seguro para um controle de acesso. Reaproveitar `usr_ana` como admin (em vez de
criar uma fixture nova) evita qualquer migração de dados/testes existentes que dependam dela como
colecionadora comum; ela continua funcionando normalmente em todos os fluxos de colecionador, só
ganha acesso adicional à área admin.

**Alternativas consideradas**: campo opcional (`role?: 'admin'`) — rejeitado por esconder a decisão
em vez de explicitá-la; uma fixture de admin totalmente nova — rejeitado por ser trabalho extra sem
benefício, já que nenhum teste existente depende de `usr_ana` *não* ser admin.

## D2 — Guard de rota: síncrono vs. assíncrono

**Decisão**: `requireRole(href, context, role)` é **assíncrono**, usando
`context.queryClient.ensureQueryData(sessionQueryOptions(token))` — verificado diretamente contra
`src/app/router.ts` (`context: { queryClient }` já passado em `createAppRouter`) e
`src/app/routes/__root.tsx` (`createRootRouteWithContext<RouterContext>()`).

**Razão**: o guard existente `requireSession` (`src/domains/auth/model/route-guard.ts`) só verifica
a presença do token (síncrono, via `hasSessionToken()`), nunca o `SessionUser` carregado. Em um
carregamento a frio direto em `/admin/products` (refresh, link direto), o cache da sessão ainda
não tem dado no momento em que `beforeLoad` roda — um guard síncrono daria falso-negativo ou
falso-positivo dependendo da ordem de carregamento. `ensureQueryData` busca (ou reaproveita o cache
já quente) antes de decidir, eliminando essa corrida.

**Alternativas consideradas**: um hook `useCachedSessionUser()` síncrono lido fora do React (ideia
inicial, descartada) — não cobre o caso de carregamento a frio; mover a checagem de papel para
dentro do componente da página (renderizar um redirecionamento do lado do cliente) — rejeitado
porque deixaria o conteúdo admin ser montado (ainda que brevemente) antes do redirecionamento,
violando FR-004 ("MUST NOT ver nenhuma tela ou dado admin").

## D3 — Onde vive a lógica de admin: domínio novo vs. extensão de `catalog`/`auth`

**Decisão**: um domínio `src/domains/admin` novo e pequeno, que importa os contratos públicos de
`@/domains/catalog` e `@/domains/auth` (tipos apenas), mas não é importado de volta por eles.

**Razão**: operações de admin tocam tanto NFTs/edições quanto usuários — nenhum dos dois domínios
existentes deveria crescer para conhecer conceitos de "admin" (cria acoplamento desnecessário com um
caso de uso que 99% dos consumidores de `catalog`/`auth` nunca usam). Um domínio dedicado respeita
a regra de dependência unidirecional (Princípio I) sem forçar `catalog`/`auth` a saberem que `admin`
existe.

## D4 — Camada de mock do admin: repositório próprio vs. reaproveitar os existentes

**Decisão**: `AdminService` (em `src/mocks/contexts/admin/service.ts`) recebe por injeção as
instâncias **já existentes** de `CatalogRepository` e `UserRepository` (construídas uma vez em
`src/mocks/composition.ts`) — nenhum repositório novo, nenhum estado duplicado.

**Razão**: Princípio V exige uma única fonte de verdade por estado simulado; um repositório de
admin próprio duplicaria o armazenamento de NFTs/usuários e arriscaria os dois ficarem
dessincronizados (ex.: o catálogo público mostrando um preço que o "admin" acha que já mudou).
Reaproveitar os repositórios existentes é o padrão já usado por `creators` (feature 004) para o
mesmo tipo de situação (nova funcionalidade sobre dados já existentes).

**Checagem de papel no mock**: `src/mocks/contexts/admin/guard.ts` expõe `requireAdmin(auth,
request)`, que resolve o usuário autenticado a partir do Bearer token (reaproveitando o que
`AuthService` já faz para outras rotas autenticadas) e lança `errors.forbidden()`
(`src/mocks/http/errors.ts`, já existente) se `user.role !== 'admin'`.

## D5 — Gerador de imagem "por IA": simulação determinística

**Decisão**: um hash FNV-1a da string do prompt vira a seed de um PRNG mulberry32 (mesmo algoritmo
de `scripts/generate-art.mjs`), que então desenha o mesmo SVG gerado pela função `tile()` do
script. Essa função de desenho é extraída para `src/mocks/infra/placeholder-art.ts`
(pura, sem I/O), importada tanto pelo script (`scripts/generate-art.mjs`, em build-time) quanto pelo
novo serviço de mock (`src/mocks/contexts/media-generation/service.ts`, em runtime no navegador).
A resposta do endpoint é uma data URI (`data:image/svg+xml;base64,...`), não um arquivo em
`public/art` — um handler MSW roda no navegador e não tem acesso a sistema de arquivos, e escrever
em `public/art` a partir de uma requisição romperia o limite "simulação só na camada de rede"
alcançando artefatos reais de build.

**Determinismo**: o mesmo texto de prompt sempre produz o mesmo hash, logo a mesma seed, logo o
mesmo SVG byte-a-byte — testável diretamente (FR-013/SC-005).

**Alternativas consideradas**: gerar a imagem como um arquivo persistido em `public/art` no
primeiro uso — rejeitado (sem acesso a FS no navegador, e contaminaria artefatos de build reais);
qualquer biblioteca de IA/geração de imagem real — explicitamente proibido pela restrição de stack
da spec (Assumptions).
