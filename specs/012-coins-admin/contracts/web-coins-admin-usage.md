# Contrato: como o site usa o admin do serviço de moedas (sem mudá-lo)

Fonte: `apps/api/src/routes/admin.ts` (constituição 1.4.0: `/admin/*` somente leitura). O site acessa sempre por
`/backend/admin/*` (same-origin; Vite proxy em dev/preview, `vercel.json` em produção ⇒ `/api/admin/*`).

| Chamada do site | Quando | Cabeçalhos | Respostas tratadas |
|---|---|---|---|
| `POST /backend/admin/login {email, password}` | entrada | — | 200 `{token, expiresAt, admin{id,email}}`; 400 `invalid_login_request`; 401 `invalid_credentials` |
| `GET /backend/admin/owners?limit=20[&cursor=…]` | lista | `Authorization: Bearer <token de admin>` | 200 `{owners, cursor?}`; 400 `invalid_query`; 401/403 ⇒ sessão encerrada |
| `GET /backend/admin/owners/:ownerId` | detalhe | idem | 200 `{balance, transactions}`; 400 `invalid_owner_id`; 401/403 ⇒ sessão encerrada |

`GET /backend/admin/me` não é necessário: a resposta do login já traz `admin.id` e `admin.email`.

Regras do cliente:

- Nunca envia o token de admin para rotas de dono (`/backend/coins/*`) nem para `/api/*`; nunca envia o token do site
  para `/backend/admin/*`.
- Repete automaticamente só rede/timeout/5xx (no máximo 2 vezes, nas consultas); login nunca é repetido sozinho.
- Nenhuma chamada de escrita (o serviço não oferece; FR-008).

## Superfície pública de `@/domains/coins-admin`

| Export | Usado por |
|---|---|
| `useCoinsAdminLogin()` (mutation `{ email, password }`) | `pages/admin-coins-login` |
| `useCoinsAdminSession()` (e-mail conectado, ou `null`) e `coinsAdminLogout(queryClient)` | as três páginas |
| `requireCoinsAdmin(href)` | rotas `admin.coins.index`, `admin.coins.$ownerId` |
| `useOwnersPage(cursors)` | `pages/admin-coins` |
| `useOwnerDetail(ownerId)` | `pages/admin-coins-owner` |
| `CoinsAdminError` (`isSessionExpired`, `isRetryable`, `isInvalidOwnerId`), `coinsAdminErrorMessage` | as três páginas |
| `loginFormSchema`, `ownersSearchSchema` | página de entrada, rota da lista |
