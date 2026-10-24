# Página `admin-order` — Detalhe do pedido (administração)

**Rota:** `/admin/orders/$orderId` (somente `role === 'admin'`).

Mostra, somente leitura, um pedido de qualquer usuário com o mesmo conteúdo do recibo do comprador (itens, valores, carteira,
rede, cupom, transação ou motivo da recusa) mais o comprador (nome, e-mail e id do usuário) e o estado. Os valores usam
os mesmos formatadores de ETH do recibo (`shared/lib/eth`). Pedido inexistente ou id malformado: "Pedido não encontrado."
com "Voltar para a lista"; falha: "Não foi possível carregar o pedido." com "Tentar de novo". Nenhuma ação altera o pedido.

**Usa o domínio:** `admin` (`useAdminOrder`, `OrderStatusBadge`).
