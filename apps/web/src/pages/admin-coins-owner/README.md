# Página `admin-coins-owner` — Dono de saldo (administração das moedas)

**Rota:** `/admin/coins/$ownerId` (exige a sessão do **administrador das moedas**: `beforeLoad: requireCoinsAdmin(...)`).

Mostra o saldo atual e as 50 operações mais recentes de um dono (tipo, valor, saldo resultante, data), da mais nova para
a mais antiga. Dono sem operações: saldo 0 e "Nenhuma operação.". Identificador fora de `[A-Za-z0-9_.-]` (até 128
caracteres) mostra "Identificador de dono inválido." sem consultar o serviço. Somente leitura: nenhuma ação altera dados.

**Usa o domínio:** `coins-admin`.
