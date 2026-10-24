# Página `admin-dashboard` — Visão geral da administração

**Rota:** `/admin` (somente administradores da sessão do site: `beforeLoad: requireRole(..., 'admin')`; visitante vai ao
login e volta depois de entrar, colecionador volta ao início com o aviso de acesso negado).

Painel inicial da administração do marketplace (simulado): totais de produtos publicados, usuários (e quantos estão
suspensos) e pedidos por estado (pendentes, confirmados, recusados), mais atalhos para Produtos, Usuários, Pedidos e
Moedas. Os números são calculados ao abrir a tela (sem tempo real); uma base nova mostra zeros, não erro. Estados:
carregando (skeleton) e erro com "Tentar de novo". Somente leitura.

**Usa o domínio:** `admin`.
