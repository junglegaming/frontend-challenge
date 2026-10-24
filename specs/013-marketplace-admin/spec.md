# Feature Specification: Administração do marketplace completa

**Feature Branch**: `013-admin-marketplace`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Admin do marketplace (simulado, sessão do site com papel de administrador) mais completo: (1) painel inicial /admin com números de produtos, usuários e pedidos e atalhos para as áreas; (2) link "Administração" no menu da conta e na navegação só para quem é administrador, hoje o admin só é alcançável digitando a URL; (3) botão "Sair" no menu do admin; (4) pedidos de todos os usuários: lista e detalhe de um pedido, somente leitura, hoje não existe listagem; (5) o menu lateral deixa de recarregar a página a cada clique, o que também resolve o menu derrubar a sessão em memória do admin das moedas (feature 012). Tudo simulado, constituição 1.7.0. Fora de escopo: alterar pedidos (cancelar, reembolsar), admin das moedas (012), perfil do usuário (014)."

Fatos verificados no repositório (2026-10-24), para situar quem lê:

1. A área de administração do marketplace já existe, mas só com **Produtos** e **Usuários**. Não há página inicial de
   administração e **nenhum link do site leva até ela**: só se chega digitando o endereço.
2. Ela é protegida pelo papel de administrador da sessão do site (a conta de demonstração `ana@nft.dev`). Visitante
   sem login vai para o login; colecionador comum volta ao início com um aviso.
3. O sistema simulado de pedidos só deixa **criar** um pedido e **consultar um pedido do próprio usuário**. Não existe
   listagem e não existe visão de administrador. Um pedido tem estado (pendente, confirmado ou recusado), comprador,
   carteira e rede, itens com valores, total, transação e, se recusado, o motivo.
4. Os menus laterais (conta e administração) **recarregam a página inteira a cada clique**. Isso pisca a tela e,
   desde a feature 012, também **derruba o acesso do administrador das moedas**, que fica só em memória.
5. O menu da administração já tem o item "Moedas" (feature 012), cuja área tem entrada própria.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chegar à administração e ver o panorama (Priority: P1)

Quem é administrador encontra um link "Administração" no menu da conta e na navegação do site, abre o painel inicial e
vê, de relance, quantos produtos, usuários e pedidos existem, com atalhos para cada área e para sair.

**Why this priority**: Hoje a administração é invisível; sem uma porta de entrada, nada do resto serve a ninguém. É a
menor fatia que entrega valor: "o admin chega onde precisa e entende o estado do marketplace".

**Independent Test**: Entrar como administrador, achar o link, abrir o painel, conferir os números e usar os atalhos;
repetir como colecionador e como visitante e confirmar que o link não aparece e o painel é recusado.

**Acceptance Scenarios**:

1. **Given** um administrador logado, **When** abre o menu da conta ou a navegação, **Then** vê o link
   "Administração" e, ao clicar, chega ao painel.
2. **Given** um colecionador comum ou um visitante, **When** olha os menus, **Then** o link "Administração" **não**
   aparece em nenhum lugar, nem por um instante enquanto a sessão carrega.
3. **Given** um colecionador comum, **When** abre o endereço do painel, **Then** volta ao início com o aviso de acesso
   negado; **Given** um visitante, **Then** vai ao login e, depois de entrar como admin, volta ao painel.
4. **Given** o painel aberto, **When** o administrador olha os números, **Then** vê o total de produtos, o total de
   usuários (com quantos estão suspensos) e o total de pedidos por estado (pendentes, confirmados, recusados).
5. **Given** o painel, **When** usa os atalhos, **Then** chega a Produtos, Usuários, Pedidos e Moedas.
6. **Given** qualquer tela da administração, **When** escolhe "Sair do site" no menu, **Then** encerra a sessão do site e vai
   para o início.
7. **Given** nenhum dado ainda (sem pedidos, por exemplo), **When** abre o painel, **Then** vê zeros, não erro.

---

### User Story 2 - Acompanhar os pedidos de todos os usuários (Priority: P2)

O administrador abre a lista de pedidos de todos os usuários, do mais recente para o mais antigo, filtra por estado e
abre qualquer pedido para ver os detalhes completos, sem poder alterá-lo.

**Why this priority**: É a capacidade nova de verdade da administração (acompanhar vendas), mas depende de chegar lá
(US1).

**Independent Test**: Com pedidos de vários usuários em estados diferentes, percorrer a lista, filtrar por estado,
abrir um pedido e comparar com o recibo do comprador.

**Acceptance Scenarios**:

1. **Given** pedidos de vários usuários, **When** o administrador abre a lista, **Then** vê, do mais recente para o mais
   antigo, cada pedido com comprador, quantidade de itens, total, estado e data.
2. **Given** mais pedidos do que cabem numa página, **When** navega entre as páginas, **Then** cada pedido aparece
   exatamente uma vez, e a página e o filtro ficam no endereço da tela.
3. **Given** a lista, **When** escolhe um estado (pendente, confirmado ou recusado), **Then** vê só os pedidos daquele
   estado; sem escolha, vê todos.
4. **Given** um pedido na lista, **When** o administrador o abre, **Then** vê o comprador, os itens (nome, edição,
   quantidade, valores), carteira e rede, cupom, subtotal, desconto, taxa, total, a transação (se houver) e o motivo
   da recusa (se recusado), iguais ao recibo que o comprador vê.
5. **Given** um identificador de pedido que não existe, **When** é aberto, **Then** vê "Pedido não encontrado" com um
   caminho de volta para a lista.
6. **Given** nenhum pedido no marketplace (ou nenhum no filtro escolhido), **When** abre a lista, **Then** vê um estado
   vazio claro.
7. **Given** qualquer tela de pedidos da administração, **When** o administrador procura uma forma de alterar um
   pedido, **Then** não encontra nenhuma: a área é somente leitura.
8. **Given** um colecionador comum, **When** tenta abrir a lista ou o detalhe de administração, **Then** é recusado
   como nas demais telas de admin, e continua só vendo os próprios pedidos nas telas dele.

---

### User Story 3 - Navegar pelos menus sem recarregar a página (Priority: P3)

Ao trocar de item nos menus laterais da conta e da administração, a tela muda sem recarregar a página, sem piscar e sem
perder o que está em memória.

**Why this priority**: Melhora toda a navegação e conserta um efeito colateral real (derrubar o acesso do admin das
moedas), mas o painel e os pedidos funcionam mesmo sem isso.

**Independent Test**: Entrar no admin das moedas, ir para o painel e voltar pelos menus e confirmar que o acesso
continua ativo e que a página não recarregou em nenhum clique.

**Acceptance Scenarios**:

1. **Given** qualquer tela com menu lateral, **When** o usuário clica num item, **Then** a página muda sem recarregar
   (a tela não pisca e o estado em memória permanece).
2. **Given** o administrador conectado ao admin das moedas, **When** navega pelos itens do menu da administração,
   **Then** continua conectado (o acesso em memória sobrevive à navegação interna).
3. **Given** o menu, **When** usa só o teclado, **Then** consegue focar e ativar cada item, e o item da página atual
   está indicado.
4. **Given** um item aberto em nova aba ou com clique do meio, **When** o usuário o aciona, **Then** o navegador
   continua se comportando normalmente (abre a nova aba).
5. **Given** um item desativado (em breve), **When** o usuário o aciona, **Then** nada acontece e ele continua
   comunicando que está indisponível.

---

### Edge Cases

- **Sessão do site expira durante o uso**: a próxima ação leva ao login e, depois de entrar, volta à tela de origem
  (como nas demais telas protegidas).
- **Pedido muda de estado sozinho** (a liquidação simulada confirma ou recusa um pedido pendente): a lista e o detalhe
  mostram o estado do momento em que carregaram; recarregar mostra o novo estado.
- **Usuário do pedido não existe mais ou foi suspenso**: o pedido continua visível, mostrando o comprador registrado
  no pedido.
- **Muitos pedidos**: sempre paginados; nunca carrega todos de uma vez.
- **Identificador de pedido malformado** no endereço: tratado como "Pedido não encontrado", sem erro técnico.
- **Serviço simulado indisponível**: mensagem clara com "Tentar de novo"; o resto do site não é afetado.
- **Administrador abre o link de uma área pelo teclado ou com a tela estreita**: o link e os atalhos continuam
  acessíveis (390, 768 e 1440 px, sem rolagem horizontal).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O site MUST oferecer um painel inicial de administração, acessível só a quem tem o papel de
  administrador na sessão do site.
- **FR-002**: O painel MUST mostrar o total de produtos, o total de usuários (e quantos estão suspensos) e o total de
  pedidos por estado (pendentes, confirmados, recusados), e MUST mostrar zeros, não erro, quando não houver dados.
- **FR-003**: O painel MUST oferecer atalhos para Produtos, Usuários, Pedidos e Moedas.
- **FR-004**: O link "Administração" MUST aparecer no menu da conta e na navegação do site **somente** para
  administradores; para visitantes e colecionadores MUST NOT aparecer, inclusive enquanto a sessão carrega.
- **FR-005**: O menu da administração MUST ter "Pedidos" e a ação "Sair do site", e MUST manter "Produtos", "Usuários" e
  "Moedas"; "Sair do site" encerra a sessão do site (o rótulo é distinto de "Sair", que nas telas das moedas
  encerra só o acesso às moedas).
- **FR-006**: O acesso às telas de administração MUST seguir a regra existente: visitante vai ao login e volta depois
  de entrar; colecionador volta ao início com aviso de acesso negado.
- **FR-007**: O administrador MUST poder listar os pedidos de **todos** os usuários, do mais recente para o mais
  antigo, mostrando comprador, quantidade de itens, total, estado e data.
- **FR-008**: A lista de pedidos MUST ser paginada, MUST permitir filtrar por estado, e a página e o filtro MUST estar
  no endereço da tela.
- **FR-009**: O administrador MUST poder abrir um pedido e ver o comprador e o mesmo conteúdo do recibo do comprador
  (itens, carteira, rede, cupom, valores, transação, motivo de recusa).
- **FR-010**: As telas de pedidos da administração MUST ser somente leitura: nenhuma ação altera um pedido.
- **FR-011**: A visão de administrador dos pedidos MUST NOT alterar o isolamento atual: um colecionador comum continua
  vendo apenas os próprios pedidos.
- **FR-012**: Os menus laterais da conta e da administração MUST navegar sem recarregar a página, manter o item atual
  indicado, continuar acessíveis por teclado, preservar o comportamento normal do navegador para nova aba e MUST
  manter inertes os itens desativados.
- **FR-013**: A navegação entre os itens do menu da administração MUST preservar o acesso em memória do admin das
  moedas (feature 012).
- **FR-014**: Estados de carregamento, vazio, erro (com "Tentar de novo") e "não encontrado" MUST existir nas telas
  novas, com mensagens específicas e acessíveis.
- **FR-015**: Tudo MUST ser simulado, sem mudar `apps/api` nem `server/`; os testes automáticos MUST rodar sem
  serviço externo.
- **FR-016**: As telas novas MUST funcionar em 390, 768 e 1440 px sem rolagem horizontal indevida.

### Key Entities

- **Administrador**: usuário do site com papel de administrador.
- **Painel**: resumo de totais de produtos, usuários (ativos e suspensos) e pedidos por estado, com atalhos.
- **Pedido (visão do admin)**: pedido de qualquer usuário, com comprador, estado, itens, valores, carteira, rede, cupom,
  transação e motivo de recusa.
- **Estado do pedido**: pendente, confirmado ou recusado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir de qualquer página do site, um administrador chega a qualquer área da administração em no
  máximo 2 cliques.
- **SC-002**: Em 100% das verificações, o link "Administração" não aparece para visitantes nem para colecionadores.
- **SC-003**: Percorrendo todas as páginas da lista de pedidos de um conjunto conhecido, 100% dos pedidos aparecem
  exatamente uma vez, e filtrar por estado mostra só pedidos daquele estado.
- **SC-004**: Em 100% dos pedidos verificados, os valores e itens do detalhe do administrador são idênticos ao recibo
  do comprador.
- **SC-005**: Em 100% dos cliques nos menus laterais, a página não recarrega, e o acesso do admin das moedas
  sobrevive à navegação entre as áreas da administração.
- **SC-006**: 0 telas da administração de pedidos oferecem alguma ação que altere um pedido.
- **SC-007**: Painel, lista e detalhe aparecem em até 2 segundos em 95% das vezes.
- **SC-008**: A suíte de testes do site roda sem serviço externo, e os testes existentes continuam com o mesmo
  resultado, salvo as mudanças deliberadas desta feature.

## Assumptions

- **Escopo permitido**: a constituição 1.7.0 inclui "pedidos no admin do marketplace" (somente leitura, exigindo o
  papel de administrador da sessão do site); esta feature não precisa de nova emenda.
- **Números do painel**: calculados ao abrir a tela, não atualizados em tempo real; recarregar mostra o estado novo.
- **Moedas no painel**: o atalho leva à área de administração das moedas (feature 012), que tem entrada própria; o
  painel não mostra números de moedas.
- **Pedido pendente**: pode mudar de estado sozinho (liquidação simulada); as telas mostram o estado do momento do
  carregamento.
- **Comprador**: é o usuário que fez o pedido, identificado pelo nome e e-mail registrados no pedido.
- **Fora de escopo**: cancelar, reembolsar ou editar pedidos; buscar pedidos por texto; exportar dados; notificações;
  o admin das moedas (feature 012); a área de perfil do usuário (feature 014).
