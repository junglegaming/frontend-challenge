# Research: Ambiente de produção do front-end

Nenhum `NEEDS CLARIFICATION` ficou aberto: o que não dá para decidir sem executar (comportamento da
Vercel em monorepo, CSP real) virou verificação explícita no quickstart, não suposição.

## D1: Topologia na Vercel

**Decision**: um projeto Vercel **próprio** para `apps/web` (distinto do projeto `nft-marketplace-api`),
com *Root Directory* `apps/web` e a instalação feita a partir da raiz do workspace pnpm. Build
`pnpm build` (`tsc -b && vite build`), saída `dist`, preset `vite`.

**Rationale**: espelha a decisão D7 da 007 (um projeto por app): deploy independente, variáveis
separadas, nenhum deploy de um app arrasta o outro. O `apps/web/vercel.json` já define build, saída e
preset.

**Alternatives considered**: um único projeto com os dois apps — rejeitado na 007 (configuração manual
de roteamento que a Vercel resolve sozinha com dois projetos) e continua rejeitado.

**Verificar (não assumir)**: que a Vercel instala o workspace a partir da raiz com *Root Directory*
`apps/web` e a opção de incluir arquivos fora do diretório raiz ligada. Validado no primeiro preview
(quickstart, passo 3); se falhar, o fallback é `installCommand: "pnpm install --frozen-lockfile"` com
`cd ../..` no `vercel.json`.

## D2: MSW continua ligado em produção para `/api/*`

**Decision**: o build de produção mantém `VITE_ENABLE_MOCKS=true`. O ambiente publicado é um demo.

**Rationale**: a constituição (Princípio V) faz de `src/mocks` a única camada de dados do produto: não
existe back-end real de catálogo, auth, carrinho ou pedidos. Desligar o MSW deixaria o site sem dados.
O valor padrão já é `true`; a mudança é torná-lo **explícito** na matriz de configuração, para que não
dependa de um padrão implícito.

**Alternatives considered**: desligar o MSW em produção — inviável (site vazio). Construir back-end
real para tudo — fora do escopo e contra a constituição.

## D3: Flag própria para o mock do `/backend`

**Decision**: nova variável `VITE_ENABLE_BACKEND_MOCKS`. Leitura em `env.ts`:
`enableBackendMocks = (VITE_ENABLE_BACKEND_MOCKS ?? (import.meta.env.DEV ? 'true' : 'false')) === 'true'`.
`src/mocks/composition.ts` só inclui `ledgerHandlers(...)` quando a flag está ligada.

**Rationale**: hoje os handlers do `ledger` ficam sempre registrados e, com o MSW ligado em produção,
interceptariam `/backend/*` — a API real nunca seria alcançada (FR-005). O padrão por modo mantém
desenvolvimento e Playwright exatamente como estão (o servidor de dev tem `DEV=true`) e torna o
build de produção seguro por omissão (esquecer a variável não mocka o back-end real).

**Alternatives considered**:
- Reutilizar `VITE_ENABLE_MOCKS` — rejeitado: ele precisa ficar `true` em produção (D2).
- Sempre mockar e deixar `onUnhandledRequest: 'bypass'` — não resolve: o handler existe e captura.
- Remover os handlers do bundle de produção por `import()` condicional — ganho pequeno, complexidade
  maior; a flag em tempo de execução basta.

## D4: Como `/backend/*` chega à API em produção

**Decision**: rewrite estático em `apps/web/vercel.json`, antes do fallback da SPA:
`/backend/:path*` → `https://nft-marketplace-api-ochre.vercel.app/api/:path*`.

**Rationale**: mesma origem para o navegador (sem CORS, sem expor a origem da API, o token trafega só
para a própria origem). É o que o Vite faz em dev (D8 da 007), então dev e produção têm o mesmo
contrato `/backend`.

**Alternatives considered**:
- Chamar a API direto por URL absoluta — exige CORS na API e expõe a origem; rejeitado.
- Função de borda/serverless fazendo proxy — mais um componente para manter, sem ganho sobre o rewrite.
- Destino vindo de variável de ambiente — o `vercel.json` não interpola variáveis. Existe configuração
  programática, mas não foi verificada neste ambiente; fica como evolução, não como base do plano.

**Risco aceito**: o domínio da API fica fixo no arquivo; trocá-lo exige editar e republicar. Previews do
front usam a API de produção (documentado na spec).

## D5: Moedas (006) em produção

**Decision**: `VITE_COINS_API_URL` deixa de ter valor padrão em builds de produção. `env.ts` passa a
expor `coinsApiUrl: string | undefined` (padrão `http://localhost:4000` **só** com `import.meta.env.DEV`)
e `coinsEnabled`. O domínio `coins` exporta `coinsEnabled`; `CoinsBalanceSection` e
`PaymentMethodPicker` somem quando falso e `useCoinsBalance` não consulta.

**Rationale**: o `server/` usa SQLite em arquivo e não é implantável na Vercel; com o padrão atual o
navegador do visitante chamaria `localhost:4000` (a máquina dele). Esconder é honesto; quebrar não.
Respeita o Princípio de que ações fora do escopo não podem parecer funcionais.

**Alternatives considered**:
- Implantar `server/` em outro provedor — SQLite em arquivo exige disco persistente; é nova
  infraestrutura, fora do escopo.
- Migrar moedas para `apps/api` — proibido pela 007 (FR-002) e é feature própria.
- Apontar `coins` para o `ledger` — semânticas diferentes (header `X-User-Id` vs token; 409 vs 402);
  seria reescrever a 006.
- Manter como está — deixa o site com tentativas de rede para `localhost`; rejeitado (SC-003).

## D6: Cache e entrega

**Decision**:
- `/assets/*` → `Cache-Control: public, max-age=31536000, immutable` (nomes com hash do Vite).
- `/index.html` e `/mockServiceWorker.js` → `Cache-Control: no-cache` (revalidar sempre).
- `mockServiceWorker.js` também com `Service-Worker-Allowed: /`.

**Rationale**: um `index.html` ou um service worker presos em cache fazem o visitante rodar uma versão
antiga contra assets que já não existem (edge case da spec). Hash no nome do asset torna o cache
imutável seguro.

**Alternatives considered**: confiar nos padrões da Vercel — funcionam hoje, mas o requisito (FR-004)
deve estar declarado e testável, não implícito em comportamento da plataforma.

## D7: Cabeçalhos de segurança e CSP

**Decision**: em `/(.*)`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` restritivo (câmera, microfone, geolocalização desligados), `X-Frame-Options: DENY`
(e `frame-ancestors 'none'` na CSP) e uma CSP:
`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'self';
form-action 'self'; frame-ancestors 'none'`.

**Rationale**: o app só carrega recursos de mesma origem (fontes via `@fontsource`, ilustrações em
`public/art`, API por `/backend`), e o MSW exige `worker-src 'self'`. `'unsafe-inline'` só em estilos
(Radix/Sonner injetam `<style>`/atributos `style`); scripts ficam estritos.

**Alternatives considered**: CSP em modo só-relatório — não há coletor de relatórios, então não
produziria evidência; `unsafe-inline` em scripts — desnecessário e enfraquece a política.

**Verificar (não assumir)**: a CSP é a parte com maior risco de quebrar o app em silêncio. O smoke de
produção (D10) falha se o console registrar violação de CSP; se registrar, relaxa-se a diretiva
específica, não se desliga a CSP.

## D8: Variáveis de ambiente — preview = produção

**Decision**: um único conjunto de variáveis para *Preview* e *Production* (ambos são builds de produção
do Vite: `DEV=false`); *Development* local usa o `.env.example`. Variáveis `VITE_*` são embutidas no
build, então alterá-las exige novo deploy.

**Rationale**: o preview existe para validar a configuração de produção; se diferisse dela, validaria
outra coisa. Matriz completa em `data-model.md`.

**Alternatives considered**: conjuntos separados por ambiente — divergência silenciosa entre preview e
produção, justamente o que se quer evitar.

## D9: Mecanismo de publicação

**Decision**: CLI (`vercel deploy` / `vercel deploy --prod`) a partir de `apps/web`, repetível pelo
quickstart. O repositório já tem remote (`github.com/odilonskt/frontend-challenge`), mas integração Git
e CI ficam fora do escopo.

**Rationale**: integração Git faz deploy a cada push e cria preview por PR — decisão de fluxo da equipe,
não de configuração de ambiente. Fica como sugestão de feature seguinte.

**Alternatives considered**: ligar a integração Git agora — muda o processo de todos sem decisão da equipe.

## D10: Como validar sem depender de acesso manual

**Decision**: (a) verificações HTTP com `curl` (cabeçalhos, cache, fallback, rewrite); (b) um projeto
Playwright separada (**`playwright.production.config.ts`**) que serve `vite build` + `vite preview` com as variáveis de produção e
confere: moedas ocultas, nenhuma requisição a `localhost`, nenhuma violação de CSP no console;
(c) o mesmo smoke contra o preview publicado, usando o segredo de bypass de proteção da Vercel;
(d) `pnpm lighthouse` contra o build publicado.

**Rationale**: a suíte e2e atual roda em modo `dev` (flags de desenvolvimento), então ela **não consegue**
provar o comportamento de produção; um projeto separado prova sem tocar na suíte existente (FR-009).

**Alternatives considered**: só teste manual — não repetível; rodar a suíte atual em modo produção —
quebraria a premissa dos snapshots e dos mocks de backend.

## D11: Dependência — a API de produção hoje responde 404

**Decision**: tratar como **pré-requisito explícito de US2** (FR-013), não como parte desta feature. O
defeito é da 007 (T022/T023). Hipótese de causa, a confirmar lá: com o preset "Express", a Vercel
ignora `api/index.ts` e o rewrite aponta para uma função inexistente; com `framework: null` o build exige
um diretório de saída (`No Output Directory named "public"`). Caminho provável: manter `framework: null`
e adicionar `outputDirectory` apontando para uma pasta `public/` mínima, preservando o desenho
`api/index.ts` + rewrite que já funciona no `vercel dev`.

**Rationale**: separar evita que esta feature fique bloqueada por um defeito alheio: US1 e US3 não
dependem da API, só US2.

**Alternatives considered**: consertar a API aqui — mistura duas features e altera `apps/api`, que a spec
declara intocado.
