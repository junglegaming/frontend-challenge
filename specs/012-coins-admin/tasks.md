---

description: "Task list for 012-coins-admin"
---

# Tasks: Administração das moedas no site

**Input**: Design documents from `/specs/012-coins-admin/`

**Prerequisites**: plan.md, spec.md, research.md (D1–D9), data-model.md, contracts/web-coins-admin-usage.md, quickstart.md

**Tests**: Incluídos. A constituição (Princípio VII) exige E2E Playwright por página contra os mocks, com falhas e snapshots visuais; os critérios SC-002…SC-005 só se provam com testes.

**Organization**: Tarefas agrupadas por história de usuário (spec.md US1–US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1–US3 da spec.md
- Todos os caminhos são relativos à raiz do repositório.

## Path Conventions

Tudo em `apps/web/` mais docs (`docs/CHALLENGE.md`, `docs/TEAMS.md`). `apps/api/`, `server/` e `domains/admin`/`domains/ledger` **não** mudam (FR-012; contextos separados, plan D1).

---

## Phase 1: Setup

- [X] T001 (2026-10-24: linha de base: 144 testes, typecheck limpo) Confirmar que a branch é `012-admin-coins` (a emenda 1.7.0 da constituição e `specs/012-coins-admin/` estão no disco, sem commit); `pnpm install` na raiz e `pnpm --dir apps/web typecheck` limpo antes de qualquer mudança. Guardar o resultado de `pnpm --dir apps/web exec playwright test --list | tail -1` como linha de base de testes

---

## Phase 2: Foundational (bloqueia as três histórias)

- [X] T002 [P] Criar `apps/web/src/domains/coins-admin/model/contracts.ts` com os schemas Zod do data-model: `loginFormSchema` (`email`: obrigatório, e-mail válido, **até 254 caracteres**; `password`: **1 a 256 caracteres**, mensagens em português por campo), `loginResponseSchema` (`{ token: string min 1, expiresAt: string, admin: { id: string, email: string } }`), `ownersPageSchema` (`{ owners: { ownerId: string, updatedAt: string }[], cursor?: string }`), `ownerDetailSchema` (`balance`: `{ ownerId, amount` inteiro **≥ 0**, `version` inteiro **≥ 0**, `updatedAt }`; `transactions`: array de `{ txId, ownerId, direction: 'credit' \| 'debit', amount` inteiro **> 0**, `resultingBalance` inteiro **≥ 0**, `createdAt }`), `errorBodySchema` (`{ error: { code, message } }`), `ownersSearchSchema` (`cursors`: array de strings de **1 a 2048 caracteres, no máximo 50**, padrão `[]`), `ownerIdSchema` (`/^[A-Za-z0-9_.-]{1,128}$/`) e as constantes `OWNERS_PAGE_SIZE = 20` e `OWNER_TRANSACTIONS_SHOWN = 50`. Sem `any`
- [X] T003 [P] Criar `apps/web/src/domains/coins-admin/api/session.ts`: sessão **só em memória** (variável de módulo, nunca `localStorage`/`sessionStorage`; FR-005): `setCoinsAdminSession({ token, expiresAt, adminId, email })`, `getCoinsAdminSession()` (devolve `null` e limpa quando `Date.now() >= Date.parse(expiresAt)`), `clearCoinsAdminSession(reason: 'logout' \| 'expired')`, `consumeCoinsAdminEndReason()` (devolve o último motivo de encerramento e o esquece; `'expired'` também quando o vencimento é detectado por `getCoinsAdminSession`), `subscribeCoinsAdminSession(listener)` e o hook `useCoinsAdminSession()` com `useSyncExternalStore` (devolve `{ email } \| null`). O token nunca é exposto pelo hook
- [X] T004 (2026-10-24: opção do cliente chama-se `withToken` (`auth` colide com a do Axios)) Criar `apps/web/src/domains/coins-admin/api/client.ts` (plan, data-model "Erros"): `coinsAdminHttp = axios.create({ baseURL: env.backendBaseUrl, timeout: env.requestTimeoutMs })` (instância própria, não importa `@/shared/api/http` nem `domains/ledger`); `CoinsAdminError` (`status`, `code`, getters `isSessionExpired` = 401 ou 403, `isInvalidCredentials` = 401 com `code === 'invalid_credentials'`, `isInvalidOwnerId` = 400 com `code === 'invalid_owner_id'`, `isRetryable` = rede/timeout/5xx); `coinsAdminRequest(config, schema)` que valida a resposta com Zod, envia `Authorization: Bearer <token>` **somente** quando `config.auth !== false` e a sessão existe, e em 401/403 de uma chamada autenticada chama `clearCoinsAdminSession('expired')` e lança `CoinsAdminError`. O login usa `auth: false`. Nunca repete sozinho (as queries decidem). Depende de T002, T003
- [X] T005 [P] Criar `apps/web/src/domains/coins-admin/model/messages.ts` com `coinsAdminErrorMessage(error: unknown): string` exatamente conforme o data-model: credencial errada ⇒ "E-mail ou senha incorretos."; sessão expirada ⇒ "Sua sessão de administrador expirou. Entre de novo."; rede/timeout/5xx ⇒ "Serviço de moedas indisponível. Tente novamente."; id inválido ⇒ "Identificador de dono inválido."; outro 400 ⇒ a mensagem do serviço; resto ⇒ "Não foi possível concluir a operação.". Depende de T004
- [X] T006 (2026-10-24: guarda lê o motivo do encerramento; hook sempre limpa o cache) Criar `apps/web/src/domains/coins-admin/api/guard.ts` e `apps/web/src/domains/coins-admin/index.ts`: `requireCoinsAdmin(href: string)` para `beforeLoad` (sem sessão válida ⇒ `throw redirect({ to: '/admin/coins/login', search: { redirect: href, reason: consumeCoinsAdminEndReason() === 'expired' ? 'expired' : undefined } })`; **não** consulta a sessão do site, FR-004); hook `useCoinsAdminSessionRedirect()` que, quando a sessão virar `null` numa página protegida, (1) **sempre** faz `queryClient.removeQueries({ queryKey: ['coins-admin'] })` (qualquer motivo; SC-005) e (2) navega para a entrada com `reason: 'expired'` e `redirect` = endereço atual **só se** o motivo for `'expired'`; no motivo `'logout'` não navega (quem clicou em "Sair" navega sozinho, sem aviso). `index.ts` exporta a API pública da tabela de `contracts/web-coins-admin-usage.md` (cresce a cada história). Depende de T003
- [X] T007 (2026-10-24: ícone `WalletIcon`) [P] Em `apps/web/src/shared/ui/admin-side-menu.tsx` aceitar `active: 'products' \| 'users' \| 'coins'` e adicionar o item "Moedas" → `/admin/coins` (ícone já existente em `@/shared/icons`, por exemplo `WalletIcon` se existir, senão o mesmo padrão dos outros itens); não mudar `side-menu.tsx` (a troca por `Link` é da feature 013)
- [X] T008 (2026-10-24: cursor com TextEncoder/btoa (o mock roda no navegador, sem `Buffer`)) [P] Em `apps/web/src/mocks/contexts/ledger/service.ts` acrescentar `listOwners(limit: number, cursor?: string)` (ordem crescente de `ownerId`; `cursor` = `base64url` do último `ownerId` da página anterior; devolve `{ owners: { ownerId, updatedAt }[], cursor? }` com `cursor` só se houver mais) e `ownerDetail(ownerId: string)` (`{ balance: getBalance(ownerId), transactions: listTransactions(ownerId, 50) }`); sem alterar os métodos existentes
- [X] T009 (2026-10-24: senha do mock só como salt+hash) [P] Criar o contexto `apps/web/src/mocks/contexts/coins-admin/service.ts` (credencial fictícia de demonstração: e-mail `moedas@nft.dev`, senha `Moedas@123`, guardada **só como salt + hash PBKDF2** calculados uma vez com o mesmo algoritmo de `apps/web/src/mocks/infra/password.ts`, 60000 iterações, 256 bits; `login(email, password)` com **resposta de falha idêntica** `401 invalid_credentials` / "E-mail or password is incorrect." para e-mail desconhecido e senha errada; `authenticate(authorization)` para tokens `mock-coins-admin.<adminId>.<expiraMs>` de 15 min, `401 missing_token` / `401 invalid_token`; `403` se o token for de dono (`mock-ledger.…`)). Documentar a credencial em `apps/web/src/mocks/contexts/coins-admin/README.md`. Depende de nada (arquivo novo)
- [X] T010 (2026-10-24: cenário de sessão expirada e registro em `composition.ts` (feito junto com a T012)) Registrar o contexto: em `apps/web/src/mocks/scenarios/definitions.ts` adicionar `coinsAdminSessionExpired?: boolean` e o cenário `{ id: 'coins-admin-session-expired', label: 'Sessão de admin de moedas expirada', description: 'Todo token de admin de moedas é recusado com 401.', latency: DEFAULT_LATENCY, coinsAdminSessionExpired: true }`; em `apps/web/src/mocks/composition.ts` instanciar o serviço e incluir os handlers (T012/T019/T025, criados nas histórias) em `...(env.enableBackendMocks ? […] : [])`, passando `unavailable: () => scenarioRuntime.current.ledgerUnavailable === true` (o cenário `coins-unavailable` da 011 passa a valer também aqui, login incluído) e `sessionExpired: () => scenarioRuntime.current.coinsAdminSessionExpired === true`; `reset` do mock restaura o estado. Depende de T008, T009

**Checkpoint**: `pnpm --dir apps/web typecheck` e `lint` passam; nada visível mudou ainda.

---

## Phase 3: User Story 1 — Entrar como administrador das moedas (Priority: P1) 🎯 MVP

**Goal**: entrar com credenciais reais, ver com qual e-mail está conectado, sair, e ser barrado sem sessão.

**Independent Test**: abrir `/admin/coins/login`, entrar com a credencial de demonstração, ver `/admin/coins` com o e-mail e o botão "Sair"; errar a senha e o e-mail e ver a mesma mensagem; sair e ser levado de volta; a sessão do site (`ana@nft.dev`) não abre a área.

### Tests for User Story 1

- [X] T011 (2026-10-24: 15 testes; `openLogin` com timeout de 20 s (falhas só em rodadas sob carga, não reproduzidas em 12 repetições)) [P] [US1] Criar `apps/web/e2e/admin-coins-login/admin-coins-login.spec.ts` (helpers de `apps/web/e2e/design-system/helpers.ts`: `signIn`, `selectScenario`, `runAxe`, `hasNoHorizontalScroll`, `VIEWPORTS`): (a) credencial válida ⇒ chega a `/admin/coins` e vê "Conectado como moedas@nft.dev"; (b) senha errada **e** e-mail inexistente ⇒ o **mesmo** texto "E-mail ou senha incorretos." e continua na entrada; (c) e-mail malformado e senha vazia ⇒ erros junto aos campos, **nenhuma** requisição a `/backend/admin/login` (contar com `page.on('request')`); (d) "Sair" ⇒ volta à entrada **sem** o aviso de expiração (`getByText('Sua sessão de administrador expirou')` ausente) e `/admin/coins` redireciona para ela de novo; (e) abrir `/admin/coins` sem sessão ⇒ vai para `/admin/coins/login?redirect=%2Fadmin%2Fcoins` e, após entrar, volta para lá; (f) `redirect` de outra origem ou fora de `/admin/coins` (`?redirect=https://evil.test`) é ignorado e cai em `/admin/coins`; (g) logado no site como admin do marketplace (`signIn` + `promoteCurrentUserToAdmin`) ainda precisa entrar aqui; (h) entrar aqui **não** cria sessão do site e sair do site não derruba esta (abrir `/account/profile` continua pedindo login do site); (i) recarregar a página pede login de novo (e `localStorage`/`sessionStorage` não contêm nenhum token: `Object.keys` sem chave com "coins-admin" nem o texto do token); (j) `selectScenario(page, 'coins-unavailable')` ⇒ "Serviço de moedas indisponível. Tente novamente." na entrada; (k) **menu (FR-010)**: logado no site como admin do marketplace (`signIn` + `promoteCurrentUserToAdmin`), abrir `/admin/users`, ver o link "Moedas" no menu "Administração" e clicar ⇒ cai em `/admin/coins/login?redirect=%2Fadmin%2Fcoins`; (l) com a sessão de admin das moedas ativa, abrir `/admin/coins/login` leva direto a `/admin/coins`; (m) axe sem violações críticas e visual nos 3 tamanhos (`admin-coins-login-390/768/1440.png`, `fullPage`)

### Implementation for User Story 1

- [X] T012 (2026-10-24: escrevi também as rotas de donos e detalhe (cobrem T019 e T025, a serem provadas pelos testes da US2 e US3)) [US1] Em `apps/web/src/mocks/contexts/coins-admin/handlers.ts` (novo) criar `coinsAdminHandlers(base, service, policy)` com `POST ${base}/admin/login` (valida corpo: e-mail válido e senha 1..256, senão `400 invalid_login_request`; sucesso `200 { token, expiresAt, admin: { id, email } }`) e `GET ${base}/admin/me`; aplicar `policy.unavailable()` (503 `service_unavailable` em tudo) e `policy.sessionExpired()` (401 `invalid_token` em toda rota autenticada). Ligar em `composition.ts` (T010). Depende de T009, T010
- [X] T013 [US1] Em `apps/web/src/domains/coins-admin/api/queries.ts` criar `useCoinsAdminLogin()` (mutation `{ email, password }` ⇒ `coinsAdminRequest({ method: 'POST', url: '/admin/login', data, auth: false }, loginResponseSchema)`; `onSuccess` ⇒ `setCoinsAdminSession`) e `coinsAdminLogout(queryClient)` (`clearCoinsAdminSession()` + `queryClient.removeQueries({ queryKey: ['coins-admin'] })`); exportar de `index.ts`. Depende de T004, T006
- [X] T014 (2026-10-24: redirect só dentro de `/admin/coins` (`safeCoinsAdminRedirect`)) [US1] Criar a página de entrada `apps/web/src/pages/admin-coins-login/AdminCoinsLoginPage.tsx`, `index.ts` e `README.md` (escopo, rota, domínio `coins-admin`): formulário com `react-hook-form` + `zodResolver(loginFormSchema)`, `Field`/`Input`/`PasswordInput` de `@/shared/ui`, botão "Entrar" desabilitado enquanto envia, erro do servidor em `role="alert"` via `coinsAdminErrorMessage`, aviso "Sua sessão de administrador expirou. Entre de novo." quando `reason === 'expired'`; após sucesso navega para `redirect` **somente se** ele começa com `/admin/coins` (comparação por prefixo sobre o caminho, rejeitando `//` e URLs absolutas), senão para `/admin/coins`. Título: "Administração das moedas". Depende de T013
- [X] T015 (2026-10-24: `routeTree.gen.ts` regenerado com o Vite (+42 linhas, só as duas rotas); a rota usa `hasCoinsAdminSession` (booleano), nunca o token) [US1] Criar `apps/web/src/app/routes/admin.coins.login.tsx` (`createFileRoute('/admin/coins/login')` com `validateSearch: z.object({ redirect: z.string().optional(), reason: z.literal('expired').optional() })`; se já houver sessão válida, redireciona para `/admin/coins`) e `apps/web/src/app/routes/admin.coins.index.tsx` (`beforeLoad: ({ location }) => requireCoinsAdmin(location.href)`, componente `AdminCoinsPage`). Regenerar `apps/web/src/app/routeTree.gen.ts` rodando `pnpm --dir apps/web build` e conferir que o diff só adiciona as duas rotas. Depende de T006, T014, T016
- [X] T016 [US1] Criar o casco da página `apps/web/src/pages/admin-coins/AdminCoinsPage.tsx`, `index.ts` e `README.md`: `PageContainer` + `AdminSideMenu active="coins"`, `h1` "Moedas", "Conectado como {email}" (`useCoinsAdminSession`), botão "Sair" (`coinsAdminLogout` e navegação para a entrada) e `useCoinsAdminSessionRedirect()`; sem lista ainda (a US2 acrescenta). Depende de T006, T007, T013
- [X] T017 (2026-10-24: 15/15 em 4 rodadas seguidas; admin-products e admin-users 20/20; baselines revisadas) [US1] Rodar `pnpm --dir apps/web typecheck && pnpm --dir apps/web lint` e `pnpm --dir apps/web exec playwright test e2e/admin-coins-login`; criar as baselines visuais (`--update-snapshots`), revisar as imagens (só a tela nova) e repetir sem a flag duas vezes: tudo verde. Depende de T011–T016

**Checkpoint**: US1 funciona contra o mock; a área exige a credencial própria e nada vaza para a sessão do site.

---

## Phase 4: User Story 2 — Consultar os donos de saldo (Priority: P2)

**Goal**: lista paginada de donos, em ordem estável, com a página atual na URL.

**Independent Test**: com 45 donos no mock, abrir a lista, avançar e voltar e confirmar que cada dono aparece uma vez; recarregar a URL e ver a mesma página; abrir um dono.

### Tests for User Story 2

- [X] T018 (2026-10-24: 15 testes + um arquivo de apoio `e2e/admin-coins/helpers.ts`; relógio congelado e UTC nos visuais) [P] [US2] Criar `apps/web/e2e/admin-coins/admin-coins.spec.ts` (semear 45 donos pelo `/backend` do mock com `fetch` dentro de `page.evaluate`: `POST /backend/auth/token` + `POST /backend/coins/topup`, como em `e2e/ledger`; identificadores só com minúsculas, dígitos e `-`, porque o serviço real ordena pela colação do Postgres e o mock pela ordem dos caracteres): (a) a primeira página mostra 20 donos (identificador e data) com "Próxima" habilitada; (b) percorrer todas as páginas (20, 20, 5) e comparar com os 45 semeados: **nenhum repetido, nenhum faltando** (SC-004) e "Próxima" some na última; (c) "Anterior" volta à página anterior idêntica; (d) a URL traz `?cursors=…` e recarregar/abrir o mesmo endereço (com sessão) mostra a mesma página; (e) estado vazio "Nenhum dono de saldo ainda." num mock recém-reiniciado; (f) clicar num dono abre `/admin/coins/<ownerId>`; (g) `selectScenario(page, 'coins-admin-session-expired')` e clicar "Próxima" ⇒ volta à entrada com "Sua sessão de administrador expirou. Entre de novo." e, ao voltar a `fast` e entrar, retorna à lista **sem** mostrar, nem por um instante, linhas da sessão anterior (aguardar a resposta nova antes de ler a tabela, e conferir `queryClient` vazio de chaves `coins-admin` logo após a expiração via `page.evaluate`); (h) `coins-unavailable` ⇒ "Serviço de moedas indisponível. Tente novamente." com "Tentar de novo" que funciona depois de voltar a `fast`; (i) `cursors` malformado na URL (mais de 50 itens ou vazio) é ignorado e mostra a primeira página; (j) nenhuma ação de escrita na tela (SC-003: nenhum botão além de Próxima/Anterior/Sair/links); (k) axe e visual nos 3 tamanhos (`admin-coins-390/768/1440.png`)

### Implementation for User Story 2

- [X] T019 (2026-10-24: já escrito na T012; validado pelos testes da US2) [US2] Em `apps/web/src/mocks/contexts/coins-admin/handlers.ts` adicionar `GET ${base}/admin/owners`: `limit` inteiro **1 a 200** (padrão 50) e `cursor` string **1 a 2048**, senão `400 invalid_query`; exige token de admin (T009); responde `ledger.listOwners(limit, cursor)` (T008). Depende de T008, T012
- [X] T020 [US2] Em `apps/web/src/domains/coins-admin/api/queries.ts` adicionar `useOwnersPage(cursors: string[])`: chave `['coins-admin', adminId, 'owners', cursors.join(',')]`, `queryFn` com `signal` e `limit = OWNERS_PAGE_SIZE`, `cursor = cursors.at(-1)`, `enabled` só com sessão, `placeholderData: keepPreviousData`, `retry` só para `isRetryable` (máximo 2); exportar. Depende de T004, T013
- [X] T021 (2026-10-24: tabela, paginador e painel em `pages/admin-coins/components/`) [US2] Criar `apps/web/src/pages/admin-coins/components/OwnersTable.tsx` e `OwnersPager.tsx`: tabela com `caption`, cabeçalhos `scope="col"` (Dono, Última movimentação), cada dono um link para `/admin/coins/$ownerId`; estados: skeleton (preserva altura), vazio, erro com `role="alert"` e botão "Tentar de novo"; paginação "Anterior"/"Próxima" que atualiza `search.cursors` (próxima = `[...cursors, cursor]`, anterior = `cursors.slice(0, -1)`), "Próxima" só se `data.cursor` existir, indicador "Página N". Depende de T020
- [X] T022 (2026-10-24: `?cursors=` é opcional e só vai para a URL quando a pilha não está vazia (o roteador gravava `?cursors=[]` na primeira página); o `catch` devolve `{ cursors: undefined }` porque o roteador junta a busca validada com a bruta) [US2] Em `apps/web/src/pages/admin-coins/AdminCoinsPage.tsx` usar `OwnersTable`/`OwnersPager` com `cursors` vindos da rota; em `apps/web/src/app/routes/admin.coins.index.tsx` acrescentar `validateSearch: z.object({ cursors: ownersSearchSchema.shape.cursors }).catch({ cursors: [] })` (valor inválido ⇒ primeira página). Atualizar o `README.md` da página. Depende de T015, T021
- [X] T023 (2026-10-24: 41 testes das três pastas passaram 3 vezes seguidas) [US2] Rodar `pnpm --dir apps/web typecheck && pnpm --dir apps/web lint` e `pnpm --dir apps/web exec playwright test e2e/admin-coins`; criar e revisar as baselines em `apps/web/e2e/admin-coins/admin-coins.spec.ts-snapshots/`; repetir duas vezes sem a flag: tudo verde. Depende de T018–T022

**Checkpoint**: US2 funciona; US1 continua verde.

---

## Phase 5: User Story 3 — Ver saldo e extrato de um dono (Priority: P3)

**Goal**: detalhe somente leitura com saldo e as 50 operações mais recentes.

**Independent Test**: abrir um dono com operações conhecidas e conferir saldo e extrato; abrir um identificador sem operações (saldo 0); abrir um id inválido; confirmar que não há ação de alteração.

### Tests for User Story 3

- [X] T024 (2026-10-24: 11 testes; os de expiração e indisponibilidade navegam para um dono ainda sem cache (o `staleTime` de 30 s do app impede o refetch por foco)) [P] [US3] Criar `apps/web/e2e/admin-coins-owner/admin-coins-owner.spec.ts`: (a) dono com crédito 100 e débito 40 ⇒ saldo "60 moedas" e extrato com débito 40 antes do crédito 100, cada linha com tipo, valor, saldo resultante e data; (b) dono com 55 operações ⇒ mostra 50 e o texto "Mostrando as 50 operações mais recentes."; (c) identificador sem operações ⇒ "0 moedas" e "Nenhuma operação."; (d) `/admin/coins/id%20invalido` (espaço) e um id de 129 caracteres ⇒ "Identificador de dono inválido." com link "Voltar para a lista" funcionando; (e) sessão expirada (`coins-admin-session-expired`) ⇒ volta à entrada e depois ao mesmo dono, sem mostrar saldo nem extrato da sessão anterior antes da resposta nova; (f) `coins-unavailable` ⇒ indisponibilidade com "Tentar de novo"; (g) nenhuma ação de alteração (SC-003); (h) "Sair" na tela do dono ⇒ entrada, e os dados do dono não ficam visíveis ao voltar (SC-005: `page.goBack()` redireciona para a entrada e o conteúdo não aparece); (i) axe e visual nos 3 tamanhos (`admin-coins-owner-390/768/1440.png`)

### Implementation for User Story 3

- [X] T025 (2026-10-24: já escrito na T012) [US3] Em `apps/web/src/mocks/contexts/coins-admin/handlers.ts` adicionar `GET ${base}/admin/owners/:ownerId`: valida com a mesma regra `^[A-Za-z0-9_.-]{1,128}$` (senão `400 invalid_owner_id` / "ownerId MUST match [A-Za-z0-9_.-] and have at most 128 characters."), exige token de admin e responde `ledger.ownerDetail(ownerId)` (T008). Depende de T008, T012
- [X] T026 [US3] Em `apps/web/src/domains/coins-admin/api/queries.ts` adicionar `useOwnerDetail(ownerId: string)`: valida `ownerIdSchema` no cliente (inválido ⇒ não consulta e devolve estado de identificador inválido), chave `['coins-admin', adminId, 'owner', ownerId]`, mesma política de `retry`; exportar. Depende de T004, T013
- [X] T027 (2026-10-24: barra de sessão (`SessionBar`) no domínio, porque duas páginas a usam e uma página não importa outra; rota `admin.coins.$ownerId` criada junto com a lista, pois o link de cada dono precisa navegar pelo roteador (um `<a href>` recarrega a página e derruba a sessão em memória)) [US3] Criar a página `apps/web/src/pages/admin-coins-owner/AdminCoinsOwnerPage.tsx`, `index.ts` e `README.md` (rota `/admin/coins/$ownerId`, domínio `coins-admin`): `AdminSideMenu active="coins"`, saldo em destaque (`aria-live="polite"`), extrato em tabela/lista acessível (tipo "Crédito"/"Débito", valor, saldo resultante, data pt-BR), aviso das 50 mais recentes quando vier o máximo, estados de carregamento/vazio/erro com `coinsAdminErrorMessage`, "Voltar para a lista"; sem nenhum botão de alteração. Criar `apps/web/src/app/routes/admin.coins.$ownerId.tsx` (`beforeLoad: requireCoinsAdmin`) e regenerar `routeTree.gen.ts` (`pnpm --dir apps/web build`). Depende de T006, T026
- [X] T028 (2026-10-24: baselines revisadas (desktop da lista e mobile do detalhe); 41/41 três vezes) [US3] Rodar `pnpm --dir apps/web typecheck && pnpm --dir apps/web lint` e `pnpm --dir apps/web exec playwright test e2e/admin-coins-owner`; baselines em `apps/web/e2e/admin-coins-owner/admin-coins-owner.spec.ts-snapshots/` revisadas e estáveis (duas execuções sem a flag). Depende de T024–T027

**Checkpoint**: as três histórias funcionam.

---

## Phase 6: Polish & Cross-Cutting

- [X] T029 (2026-10-24: `docs/CHALLENGE.md` (atividade, ofertas e downloads entram na entrega simulada) e `docs/TEAMS.md` (3 páginas e o domínio `coins-admin`; `wallets` agora também usa `ledger`, ajuste da 011)) [P] Em `docs/CHALLENGE.md` corrigir o parágrafo "Páginas editoriais, suporte, atividade, ofertas e downloads não fazem parte da entrega…" para "Páginas editoriais e suporte não fazem parte da entrega. Atividade, ofertas e downloads entram na entrega simulada (constituição 1.7.0).", mantendo o resto da frase (FR-013); em `docs/TEAMS.md` acrescentar as três páginas (`pages/admin-coins-login`, `pages/admin-coins`, `pages/admin-coins-owner`) à tabela de Páginas e o domínio `coins-admin` à tabela de Domínios ("Admin real das moedas: sessão em memória, lista de donos, saldo e extrato; somente leitura")
- [X] T030 (2026-10-24: README do domínio e da página da lista; os únicos `localStorage`/`sessionStorage` no código da área são o comentário que diz que não são usados) [P] Escrever `apps/web/src/domains/coins-admin/README.md` (contexto delimitado e por que não reaproveita `admin`/`ledger`; sessão só em memória e expiração de 15 min; paginação por pilha de cursores; códigos e mensagens; somente leitura; credencial do mock) e conferir que `grep -rn "localStorage\|sessionStorage" apps/web/src/domains/coins-admin` não devolve nada (FR-005)
- [X] T031 (2026-10-24: suíte de produção 9/9; bundle sem `localhost:<porta>`) Em `apps/web/e2e/production/hardening.spec.ts` acrescentar um teste: `/admin/coins/login` renderiza no build de produção; ao enviar credenciais, a requisição vai para `/backend/admin/login` (mesma origem) e, sem API local, a tela mostra "Serviço de moedas indisponível. Tente novamente."; nenhuma requisição para `localhost`/porta 4000. Com `PLAYWRIGHT_BASE_URL` definido (site publicado) o teste só verifica que a página de entrada carrega (sem credenciais reais)
- [X] T032 (2026-10-24: typecheck, lint e build verdes; suíte completa 185 passed, 0 falhas (144 + 41 novos); sem mudança em apps/api, server, domains/admin, domains/ledger) Gate de regressão a partir da raiz: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `node apps/web/scripts/check-production-bundle.mjs`, `pnpm --dir apps/web exec playwright test` (suíte completa, mesma linha de base de T001 mais os testes novos, **0 falhas**) e `-c playwright.production.config.ts`; `git status` sem mudanças em `apps/api/`, `server/`, `apps/web/src/domains/admin` nem `apps/web/src/domains/ledger`
- [ ] T033 **Precisa de um admin real e de um `apps/api` local.** Validação manual do quickstart passo 3: `pnpm --dir apps/api dev:local` e `VITE_ENABLE_BACKEND_MOCKS=false BACKEND_PROXY_TARGET=http://localhost:4001 pnpm --dir apps/web dev`; entrar em `/admin/coins/login` com um admin semeado (o usuário informa a credencial; nunca gravar em arquivo nem imprimir), navegar pela lista e por um dono e conferir na aba Rede que `Authorization` só vai para `/backend/admin/*`. Registrar o resultado sob "Resultado" em `specs/012-coins-admin/quickstart.md`
- [ ] T034 **Precisa de confirmação do usuário — publica o site.** Depois do merge, `pnpm exec vercel deploy --prod` em `apps/web`; entrar em `https://nft-marketplace-web-wheat.vercel.app/admin/coins/login` com o admin real, abrir a lista e um dono, sair (SC-001, SC-006: medir o tempo de carga da lista 20 vezes e registrar o p95 no quickstart). Somente leitura: nada é alterado no banco

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T010)** → US1 → US2 → US3 → Polish.
- Dentro de Foundational: T002 e T003 primeiro; T004 depende de ambos; T005 de T004; T006 de T003; T007, T008, T009 são independentes (T009 e T008 em arquivos diferentes); T010 por último (depende de T008 e T009 e referencia handlers criados nas histórias, então a ligação final é completada em T012/T019/T025).

### User Story Dependencies

- **US1** precisa de Foundational inteira. Entrega o casco de `/admin/coins` (e-mail e "Sair") para que o login tenha onde chegar.
- **US2** acrescenta a lista sobre o casco da US1 (T022 edita `AdminCoinsPage.tsx`).
- **US3** é independente da US2 na lógica (só precisa de rota, guarda e mock), mas é navegada a partir dela.

### Within Each Story

- E2E primeiro (T011, T018, T024), vê-los falhar, depois mock → queries → UI → baselines.

### Parallel Opportunities

- Foundational: T002 ∥ T003; depois T005 ∥ T006 ∥ T007 ∥ T008 ∥ T009.
- US1: T011 ∥ T012. US2: T018 ∥ T019 ∥ T020. US3: T024 ∥ T025 ∥ T026.
- Polish: T029 ∥ T030.

## Parallel Example: Foundational

```text
Task: "T002 apps/web/src/domains/coins-admin/model/contracts.ts"
Task: "T003 apps/web/src/domains/coins-admin/api/session.ts"
--- depois ---
Task: "T007 AdminSideMenu item Moedas"
Task: "T008 LedgerService.listOwners/ownerDetail no mock"
Task: "T009 contexto mocks/contexts/coins-admin (credencial, tokens)"
```

## Implementation Strategy

### MVP First (US1)

T001–T017: entrar, ver o e-mail, sair e ser barrado sem sessão, com a separação de sessões provada. Não mostra dados de donos ainda; a lista (US2) é o próximo incremento.

### Incremental Delivery

1. US1 → casco e login. 2. US2 → lista paginada. 3. US3 → detalhe. 4. Polish (T029–T034): docs, produção, regressão, validação manual, publicação.

## Notes

- `apps/api` e `server/` NÃO mudam. Se uma tarefa parecer exigir mudar o serviço (por exemplo renovar o acesso de 15 min ou paginar o extrato), parar: é outra feature (FR-012).
- O token de admin nunca vai para `localStorage`/`sessionStorage`, nunca para rotas de dono e nunca é impresso em log nem teste.
- Ações externas só com confirmação imediata do usuário: T033 (credencial real) e T034 (publicação).
