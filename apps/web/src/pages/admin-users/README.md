# Página `admin-users` — Administração de Usuários

**Rota:** `/admin/users` (somente administradores — `beforeLoad: requireRole(..., 'admin')`)

Busca/listagem de contas, detalhe de um usuário, suspensão (encerra sessões ativas) e reativação.
Bloqueia a suspensão do único administrador ativo restante.

**Usa o domínio:** `admin`.
