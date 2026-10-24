# Research: Administração do marketplace completa

Sem `NEEDS CLARIFICATION`. As decisões de escopo vieram do planejamento com o usuário e da constituição 1.7.0.

## D1: O contexto `admin` é dono das leituras do administrador

**Decision**: contratos, queries e hooks da visão geral e dos pedidos do admin vivem em `domains/admin`; o domínio
`orders` do site não muda (o `Order` continua sendo o tipo do recibo, reaproveitado pela API pública de `orders`).

**Rationale**: DDD: quem lê, e com qual permissão, define o contexto. Pedidos do ponto de vista do administrador (todos
os usuários, comprador, filtro) é linguagem de administração; no contexto de pedidos o dono só vê os próprios. O pedido
do usuário ("a visão do admin em `orders`") era sobre a capacidade, não sobre onde o código mora.

**Alternatives considered**: pôr as leituras em `domains/orders` (misturaria a permissão de admin com o isolamento do
colecionador). Rejeitada.

## D2: Menu sem recarregar, mantendo o `<a href>`

**Decision**: `SideMenuItem` continua renderizando `<a href>` (acessível, "abrir em nova aba" e clique do meio
funcionam) e intercepta só o clique simples (botão esquerdo, sem Ctrl/Cmd/Shift/Alt, sem `target`, não prevenido):
`event.preventDefault()` e `router.history.push(href)` (`useRouter` da biblioteca). Itens desativados e itens com
`onClick` (botões) não mudam.

**Rationale**: FR-012/FR-013. `shared/` não pode importar `app/`, mas pode usar a biblioteca do roteador. O `href` livre
(string) evita acoplar o componente genérico ao mapa de rotas tipado.

**Alternatives considered**: `<Link to={href}>` (o `to` é tipado pelo mapa de rotas, obrigando o componente genérico a
conhecê-lo); trocar `<a>` por botões (perde nova aba e semântica de link). Rejeitadas.

## D3: Link "Administração" só com papel confirmado

**Decision**: o menu da conta recebe `showAdmin` (as páginas passam `session.data?.user.role === 'admin'`) e a
`Navbar` mostra o link quando o usuário da sessão tem `role === 'admin'`. Papel desconhecido (sessão carregando) =
oculto.

**Rationale**: FR-004 (não aparecer nem por um instante). O papel já vem da sessão do site (`useSession`).

## D4: "Sair do site" no menu do admin

**Decision**: o menu do admin ganha o item "**Sair do site**" (encerra a sessão do site e volta ao início; hook
`useAdminLogout` em `domains/admin`). Nas telas das moedas a ação da própria área continua "Sair"; os testes da 012 que
procuram o botão por nome passam a usar nome exato.

**Rationale**: FR-005. Nas telas de moedas ficariam dois botões "Sair" (um do site, outro do acesso às moedas); o
rótulo distinto evita erro de uso e ambiguidade de teste (o nome acessível casa por substring).

## D5: Menu da administração: "Visão geral", "Produtos", "Usuários", "Pedidos", "Moedas", "Sair do site"

**Decision**: acrescenta "Visão geral" (volta ao painel) e "Pedidos"; mantém os atuais; ordem: Visão geral, Produtos,
Usuários, Pedidos, Moedas, separador, Sair do site. `active`: `'overview' | 'products' | 'users' | 'orders' | 'coins'`.

**Rationale**: sem um item para o painel não haveria caminho de volta (FR-003/SC-001).

## D6: Endpoints simulados novos (todos exigem `role: admin`)

**Decision** (contrato em `contracts/admin-marketplace-endpoints.md`):
- `GET /api/admin/overview` → totais de produtos (publicados, não retirados da vitrine), usuários (total e suspensos) e
  pedidos (total e por estado), numa única resposta coerente;
- `GET /api/admin/orders?status=&page=&pageSize=` → página de pedidos, do mais recente para o mais antigo;
- `GET /api/admin/orders/:orderId` → pedido de qualquer usuário (ou `404`).

O `OrderService` do mock ganha `listAll`, `getAny` e `countByStatus`, que "liquidam" pedidos pendentes vencidos antes de
ler (como `get` já faz), para o painel, a lista e o detalhe concordarem.

**Rationale**: FR-001/002/007/009; uma chamada para o painel evita três consultas e números de momentos diferentes.

## D7: Página e filtro na URL, com parâmetros opcionais

**Decision**: `/admin/orders?status=pending|confirmed|declined&page=2`; `status` ausente = todos, `page` ausente = 1;
nunca se grava o padrão na URL. A validação usa `.catch({ status: undefined, page: undefined })` **nomeando as chaves**
(lição da 012: o roteador junta a busca validada com a bruta, e um resultado sem a chave deixaria passar um valor
malformado). Tamanho de página fixo: 20.

**Rationale**: Princípio III e FR-008.

## D8: Detalhe como visão própria

**Decision**: `pages/admin-order` monta o detalhe somente leitura (comprador, estado, itens, carteira/rede, cupom,
valores, transação, motivo de recusa) com os mesmos formatadores de ETH (`@/shared/lib/eth`) do recibo, para os valores
serem idênticos (SC-004). O estado do pedido aparece como selo (`OrderStatusBadge`, em `domains/admin/components`, usado
por lista e detalhe).

**Rationale**: o recibo do comprador é componente de página e só cobre `confirmed`; o admin precisa dos três estados.

## D9: Testes

**Decision**: uma pasta por página (`e2e/admin-dashboard`, `e2e/admin-orders`, `e2e/admin-order`) com axe e snapshots nos
três tamanhos (relógio congelado, UTC); casos de falha: visitante, colecionador, id inexistente e malformado, vazio, erro
(cenário de falha existente), paginação sem repetir pedidos, filtro, link só para admin, menu sem recarregar. O
"sem recarregar" se prova marcando `window` antes do clique e conferindo que a marca sobrevive; o efeito na 012 se prova
entrando no admin das moedas e navegando pelo menu sem perder o acesso. Pedidos de vários usuários são criados pelo mock
com `createOrderViaApi` (helper existente) e contas novas.
