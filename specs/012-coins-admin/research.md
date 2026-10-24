# Research: Administração das moedas no site

Sem `NEEDS CLARIFICATION`. As decisões de escopo (admin real, somente leitura, sessão separada e não persistida) vieram
do planejamento com o usuário e da constituição 1.7.0.

## D1: Contexto delimitado próprio `domains/coins-admin`

**Decision**: domínio novo com modelo, cliente HTTP, sessão e guarda próprios.

**Rationale**: DDD pedido pelo usuário. "Administrador das moedas" é outro papel, com outra credencial e outro serviço;
não é o "admin" do marketplace (papel da sessão simulada do site) nem o "dono" do `ledger`. Fronteiras explícitas
evitam que um token valha pelo outro (FR-004).

**Alternatives considered**: estender `domains/admin` (misturaria sessões, contra a 1.7.0); estender `domains/ledger`
(contexto de dono, outro token). Rejeitadas.

## D2: Sessão em memória, com `expiresAt`

**Decision**: `api/session.ts` guarda `{ token, expiresAt, adminId, email }` numa variável de módulo, com `subscribe`
(lido nos componentes por `useSyncExternalStore`). Nunca escreve em `localStorage` nem `sessionStorage`. Logout,
expiração (`expiresAt` vencido) ou 401/403 do serviço encerram a sessão. O encerramento guarda o **motivo**
(`'logout'` ou `'expired'`) até ser lido uma vez: só `'expired'` leva à entrada com o aviso de expiração, e o logout
navega sem aviso. Qualquer encerramento, por qualquer motivo, remove do cache tudo que tem chave `['coins-admin', …]`
(feito pelo hook de sessão, que é quem tem o `queryClient`; o módulo de sessão não o conhece).

**Rationale**: FR-005, SC-005 e a regra da 1.7.0. Recarregar a página pede login de novo, comportamento aceito na spec.

**Alternatives considered**: `sessionStorage` (sobrevive ao reload na aba, mas é armazenamento do navegador acessível a
qualquer script da origem; a 1.7.0 proíbe `localStorage` e o plano escolheu memória como padrão). Rejeitado.

## D3: Guarda de rota `requireCoinsAdmin(href)`

**Decision**: chamada no `beforeLoad` de `/admin/coins` e `/admin/coins/$ownerId`. Sem sessão válida ⇒
`redirect({ to: '/admin/coins/login', search: { redirect: href, reason } })`, com `reason: 'expired'` quando havia
sessão vencida. Não consulta a sessão do site.

**Rationale**: FR-003/FR-004 e o padrão de guardas já usado (`requireSession`, `requireRole`).

## D4: 401 durante o uso

**Decision**: o cliente transforma respostas em `CoinsAdminError`. `401` (token ausente, inválido ou expirado) ⇒ limpa a
sessão e a página que recebeu o erro navega para a entrada com `reason=expired` e `redirect` = endereço atual. `403`
(token que não é de admin) é tratado igual. Repetição automática só para rede/timeout/5xx, no máximo 2 vezes.

**Rationale**: Edge case "acesso expira durante o uso"; o serviço não renova token (FR-012).

## D5: Paginação com pilha de cursores na URL

**Decision**: a lista usa `search.cursors: string[]` (vazio = primeira página). "Próxima" acrescenta o `cursor`
devolvido pelo serviço; "Anterior" remove o último. O endereço reproduz a mesma página após reload (com o admin
conectado) ou compartilhamento (FR-006). Tamanho de página fixo: 20. Até 50 cursores na pilha (limite defensivo).

**Rationale**: o serviço só devolve o cursor da próxima página (opaco, ordem por `ownerId`), não o da anterior; guardar
a pilha é a forma de voltar sem decodificar o cursor. Princípio III exige paginação na URL.

**Alternatives considered**: decodificar o cursor (acopla ao formato interno do serviço); voltar pelo histórico do
navegador (não funciona ao abrir o endereço direto). Rejeitadas.

## D6: Mock MSW das rotas de admin

**Decision**: contexto `mocks/contexts/coins-admin` com `POST /admin/login`, `GET /admin/me`, `GET /admin/owners`,
`GET /admin/owners/:ownerId` sob o prefixo `/backend`. Lê os donos do mesmo `LedgerService` da 011 (novos métodos
`listOwners(limit, cursor)` em ordem de `ownerId` com cursor `base64url`, e `ownerDetail(ownerId)` com saldo + 50 últimas
operações). Credencial fictícia: um admin de demonstração com senha guardada só como hash PBKDF2
(`mocks/infra/password.ts`), documentada no README do contexto. Tokens `mock-coins-admin.<adminId>.<expira>` com 15 min.
Mesmas respostas de erro do `apps/api` (`invalid_credentials` idêntico, `missing_token`, `invalid_token`,
`invalid_query`, `invalid_owner_id`, 503 no cenário `coins-unavailable`).

**Rationale**: FR-011 e Princípio V; reaproveitar o estado do mock de moedas mantém a consistência entre o que o dono vê
e o que o admin vê.

## D7: Cenário de expiração

**Decision**: cenário `coins-admin-session-expired`: o mock recusa todo token de admin com `401 invalid_token`. Os testes
entram, trocam para esse cenário e verificam a volta à entrada com a mensagem de expiração.

**Rationale**: testar a expiração sem esperar 15 minutos nem manipular relógio.

## D8: Navegação

**Decision**: `AdminSideMenu` ganha `active: 'coins'` e o item "Moedas" → `/admin/coins`. As telas da área mostram o
e-mail conectado e o botão "Sair" (logout do admin de moedas apenas).

**Rationale**: FR-010. A troca de `<a href>` por `Link` no `side-menu` é da 013; esta feature não muda o componente
genérico.

## D9: Testes

**Decision**: uma pasta por página (`e2e/admin-coins-login`, `e2e/admin-coins`, `e2e/admin-coins-owner`), com axe e
snapshots nos três tamanhos; casos de falha: credencial errada (mensagem idêntica para e-mail inexistente e senha
errada), sessão do site não vale aqui e vice-versa, expiração, 503, id inválido, lista vazia, paginação ida e volta sem
repetir donos, ausência de ações de escrita. Build de produção: a tela de entrada aparece e a tentativa de login vai
para `/backend/admin/login` (sem API local, a resposta de falha é mostrada como indisponibilidade).
