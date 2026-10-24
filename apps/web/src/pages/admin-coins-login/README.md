# Página `admin-coins-login` — Entrada do administrador das moedas

**Rota:** `/admin/coins/login` (pública; `?redirect=` volta à página pedida, `?reason=expired` mostra o aviso de
expiração).

Entrada com e-mail e senha do **administrador do serviço de moedas** (`apps/api`), que é uma conta diferente da conta
do site. O acesso fica só em memória e vale 15 minutos (recarregar a página ou esperar expirar pede nova entrada).
Falhas de entrada mostram sempre a mesma mensagem ("E-mail ou senha incorretos."). O `redirect` só é aceito dentro de
`/admin/coins` (nunca outra origem).

**Usa o domínio:** `coins-admin`.
