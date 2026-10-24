# Página `admin-coins` — Moedas (administração)

**Rota:** `/admin/coins` (exige a sessão do **administrador das moedas**: `beforeLoad: requireCoinsAdmin(...)`; a sessão
do site não vale aqui). `?cursors=…` guarda a pilha de cursores da página atual (a primeira página não leva parâmetro).

Lista paginada (20 por página, ordem estável por identificador) dos donos de saldo, com a data da última movimentação;
cada dono abre `/admin/coins/$ownerId` pelo roteador (um `<a href>` recarregaria a página e encerraria a sessão, que vive
só em memória). Mostra com qual e-mail o administrador está conectado e a ação "Sair". Estados: carregando (skeleton),
vazio ("Nenhum dono de saldo ainda."), erro com "Tentar de novo". Somente leitura: nenhuma ação altera saldo ou dados.

**Usa o domínio:** `coins-admin`.
