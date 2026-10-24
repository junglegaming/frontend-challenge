# Contract: Admin Users (`pages/admin-users`, rota `/admin/users`, admin-only)

## Acesso

Mesmo guard de `admin-products.md`: `requireRole(location.href, context, 'admin')`.

## Endpoints novos (admin-only; `requireAdmin` em cada handler)

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/api/admin/users?q=` | — | `AdminUserSummary[]` filtrado por nome/e-mail |
| GET | `/api/admin/users/:userId` | — | `AdminUserDetail` ou 404 |
| POST | `/api/admin/users/:userId/suspend` | — | `AdminUserDetail` atualizado, ou `409` se isso deixaria zero administradores ativos (FR-011) |
| POST | `/api/admin/users/:userId/reactivate` | — | `AdminUserDetail` atualizado |

`suspend` também invalida (apaga) todas as `SessionRecord`s daquele usuário — a próxima requisição
autenticada dele responde como sessão inexistente, equivalente ao comportamento já existente de
sessão expirada (FR-009, SC-004).

## Tela

- Campo de busca (nome/e-mail) → lista de resultados.
- Selecionar um resultado abre o painel de detalhe (perfil + papel + status).
- Botão "Suspender"/"Reativar" conforme o status atual; "Suspender" fica desabilitado com uma
  explicação quando o alvo é o único administrador ativo (FR-011, Edge Cases).
