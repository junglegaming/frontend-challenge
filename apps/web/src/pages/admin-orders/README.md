# Página `admin-orders` — Pedidos (administração)

**Rota:** `/admin/orders` (somente `role === 'admin'`: `beforeLoad: requireRole(..., 'admin')`). `?status=` (pendente,
confirmado ou recusado) e `?page=` guardam o filtro e a página; o padrão (todos, página 1) nunca é escrito no endereço, e
um valor inválido cai no padrão.

Lista os pedidos de **todos** os usuários, do mais recente para o mais antigo, 20 por página: pedido (link para o
detalhe), comprador (nome e e-mail registrados no pedido), itens, total, estado (selo com texto e cor) e data. Trocar o
filtro volta à página 1. Estados: carregando (skeleton), vazio ("Nenhum pedido encontrado."), erro com "Tentar de novo".
Somente leitura: nenhuma ação altera pedido.

**Usa o domínio:** `admin` (`useAdminOrders`, `OrderStatusBadge`).
