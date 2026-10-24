# Feature Specification: Administração das moedas no site

**Feature Branch**: `012-admin-coins`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Admin das moedas (API real) no site: uma área no apps/web onde o administrador do back-end de moedas (apps/api, ex.: batata@batata.com) entra com e-mail e senha reais e, somente leitura, vê a lista de donos de saldo com paginação e, ao abrir um dono, o saldo e o extrato. Telas: /admin/coins/login, /admin/coins, /admin/coins/$ownerId; item "Moedas" no menu do admin; sair do admin de moedas. Contexto próprio (administração de moedas), separado do admin do marketplace: o acesso do admin das moedas é outro papel, não se mistura com a sessão do site e não fica salvo no armazenamento permanente do navegador (constituição 1.7.0). Sem mudança no serviço de moedas. Também atualizar docs/CHALLENGE.md:48."

Fatos verificados no repositório (2026-10-24), para situar quem lê:

1. O serviço de moedas real já tem administradores de verdade (e-mail e senha, ex.: `batata@batata.com`) e já oferece,
   somente para eles, quem está logado, a lista de donos de saldo (paginada, em ordem de identificador) e o detalhe de um
   dono (saldo + últimas 50 operações). Não oferece nenhuma operação de escrita para o admin.
2. O acesso de admin do serviço vale **15 minutos** e não é renovado; depois disso, é preciso entrar de novo.
3. Hoje o site **não tem tela** para esse admin: quem quer consultar precisa chamar o serviço por linha de comando.
4. O site já tem uma área de administração **simulada** (produtos e usuários, com a conta `ana@nft.dev`), que é outro
   sistema, com outros usuários e outro login. As duas não podem se misturar.
5. Login com e-mail desconhecido e com senha errada recebem a mesma resposta do serviço (de propósito).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar como administrador das moedas (Priority: P1)

O administrador das moedas abre a área de administração das moedas, informa e-mail e senha e entra. Se errar, recebe uma
mensagem genérica, sem revelar se o e-mail existe. Ele pode sair quando quiser.

**Why this priority**: Sem entrar, nada mais da feature existe; é a menor fatia que prova a ligação site → serviço real
para o papel de admin.

**Independent Test**: Abrir a página de entrada do admin das moedas, entrar com credenciais válidas e ver o painel com o
e-mail do admin; tentar com senha errada e com e-mail inexistente e ver a mesma mensagem; sair e ser levado de volta à
entrada.

**Acceptance Scenarios**:

1. **Given** credenciais válidas, **When** o admin entra, **Then** chega à lista de donos e vê com qual e-mail está
   conectado.
2. **Given** senha errada ou e-mail inexistente, **When** tenta entrar, **Then** vê a mesma mensagem "E-mail ou senha
   incorretos." nos dois casos, e continua na página de entrada.
3. **Given** o admin conectado, **When** escolhe "Sair", **Then** o acesso é descartado e qualquer página do admin das
   moedas leva de volta à entrada.
4. **Given** alguém não conectado como admin das moedas, **When** abre diretamente a lista ou o detalhe de um dono,
   **Then** é levado à página de entrada e, após entrar, volta para a página que tentou abrir.
5. **Given** uma pessoa logada no site como admin do marketplace (ou qualquer outro usuário do site), **When** abre a
   área de administração das moedas, **Then** ainda precisa entrar com as credenciais de admin das moedas: uma sessão
   não vale pela outra.

---

### User Story 2 - Consultar os donos de saldo (Priority: P2)

Conectado, o admin vê a lista de donos de saldo, página a página, com a data da última movimentação de cada um, e abre
qualquer um para ver os detalhes.

**Why this priority**: É o motivo de existir da área; depende de entrar (US1).

**Independent Test**: Com vários donos no serviço, abrir a lista, avançar e voltar páginas e confirmar que nenhum dono se
repete nem some; abrir um dono a partir da lista.

**Acceptance Scenarios**:

1. **Given** donos existentes, **When** o admin abre a lista, **Then** vê os primeiros donos (identificador e data da
   última movimentação), em ordem estável, com a indicação de que há mais páginas quando houver.
2. **Given** mais de uma página, **When** avança e depois volta, **Then** vê as mesmas páginas, sem donos repetidos nem
   perdidos.
3. **Given** nenhum dono, **When** abre a lista, **Then** vê o estado vazio "Nenhum dono de saldo ainda.".
4. **Given** a lista aberta, **When** escolhe um dono, **Then** abre o detalhe daquele dono.
5. **Given** a página da lista recarregada ou compartilhada com o mesmo endereço, **When** é aberta (com o admin
   conectado), **Then** mostra a mesma página da lista.

---

### User Story 3 - Ver saldo e extrato de um dono (Priority: P3)

Ao abrir um dono, o admin vê o saldo atual e as operações mais recentes (crédito ou débito, valor, saldo resultante e
data), sem poder alterar nada.

**Why this priority**: Completa a consulta; depende das anteriores.

**Independent Test**: Abrir o detalhe de um dono com operações conhecidas e conferir saldo e extrato; abrir um
identificador inexistente e ver saldo zero sem extrato; confirmar que não há nenhuma ação de alteração na tela.

**Acceptance Scenarios**:

1. **Given** um dono com operações, **When** o admin abre o detalhe, **Then** vê o saldo atual e as até 50 operações mais
   recentes, da mais nova para a mais antiga.
2. **Given** um identificador sem nenhuma operação, **When** é aberto, **Then** vê saldo 0 e "Nenhuma operação." (não
   erro).
3. **Given** um identificador inválido no endereço, **When** é aberto, **Then** vê uma mensagem clara de identificador
   inválido e um caminho de volta para a lista.
4. **Given** qualquer tela desta área, **When** o admin procura uma forma de alterar saldo ou dados, **Then** não
   encontra nenhuma: a área é somente leitura.

---

### Edge Cases

- **Acesso expira durante o uso** (15 minutos): a próxima consulta leva à página de entrada com a mensagem "Sua sessão
  de administrador expirou. Entre de novo." e, ao entrar, volta para onde estava.
- **Recarregar a página**: o acesso de admin não é guardado de forma permanente no navegador; após recarregar, pode ser
  preciso entrar de novo (comportamento esperado, por segurança).
- **Serviço de moedas indisponível**: mensagem "Serviço de moedas indisponível. Tente novamente." com opção de tentar de
  novo; nada do resto do site é afetado.
- **Sair do site (logout do marketplace)**: não afeta o acesso de admin das moedas, e vice-versa; sair do admin das
  moedas não desconecta a pessoa do site.
- **Muitos donos**: a lista é paginada; nunca carrega todos de uma vez.
- **Dono com mais de 50 operações**: o detalhe deixa claro que mostra as 50 mais recentes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O site MUST oferecer uma página de entrada do admin das moedas onde o administrador informa e-mail e senha
  e é autenticado pelo serviço de moedas real.
- **FR-002**: Falhas de entrada MUST mostrar a mesma mensagem para e-mail inexistente e senha errada; entradas inválidas
  (e-mail malformado, senha vazia) MUST ser recusadas antes do envio, com o erro junto ao campo.
- **FR-003**: Todas as telas do admin das moedas, exceto a de entrada, MUST exigir um acesso de admin das moedas válido;
  sem ele, a pessoa é levada à entrada e, depois de entrar, volta à página pedida.
- **FR-004**: O acesso de admin das moedas MUST ser independente da sessão do site: não concede nem exige papéis do
  site, não é afetado pelo login/logout do site e não o afeta.
- **FR-005**: O acesso de admin das moedas MUST NOT ser guardado no armazenamento permanente do navegador; sair ou a
  expiração MUST descartá-lo, junto com os dados consultados.
- **FR-006**: A lista de donos MUST ser paginada, em ordem estável, mostrando identificador e data da última
  movimentação, com navegação para a próxima página e de volta; a página atual MUST estar no endereço da tela.
- **FR-007**: O detalhe de um dono MUST mostrar o saldo atual e as até 50 operações mais recentes (tipo, valor, saldo
  resultante, data), informando que são as mais recentes.
- **FR-008**: A área MUST ser somente leitura: nenhuma tela oferece alterar saldo, operações ou administradores.
- **FR-009**: Acesso expirado, serviço indisponível e identificador inválido MUST ter mensagens específicas e acessíveis,
  com caminho de recuperação (entrar de novo, tentar de novo, voltar à lista).
- **FR-010**: O menu da administração MUST ter o item "Moedas", que leva a esta área; a área MUST ter a ação "Sair".
- **FR-011**: Em desenvolvimento e nos testes automáticos, a área MUST funcionar com uma simulação do serviço que se
  comporta como o real (credenciais, mensagem única de falha, paginação, expiração, indisponibilidade); no site
  publicado, MUST usar o serviço real, pelo mesmo caminho de domínio próprio já usado pelas moedas.
- **FR-012**: O serviço de moedas MUST NOT mudar por causa desta feature.
- **FR-013**: A documentação de escopo do desafio (`docs/CHALLENGE.md`) MUST deixar de listar atividade, ofertas e
  downloads como fora da entrega, alinhada à constituição 1.7.0.

### Key Entities

- **Administrador das moedas**: identificado por e-mail; entra com senha; tem um acesso temporário (15 minutos).
- **Dono de saldo**: identificador e data da última movimentação.
- **Saldo**: quantidade de moedas de um dono e versão/data da última alteração.
- **Operação**: crédito ou débito, valor, saldo resultante e data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um administrador consegue entrar e encontrar o saldo de um dono específico em menos de 1 minuto.
- **SC-002**: Em 100% das tentativas com credenciais erradas (e-mail inexistente ou senha errada) a resposta mostrada é
  idêntica.
- **SC-003**: 0 telas da área oferecem alguma ação que altere dados.
- **SC-004**: Ao percorrer todas as páginas da lista de um conjunto conhecido de donos, 100% dos donos aparecem
  exatamente uma vez.
- **SC-005**: Depois de sair ou de o acesso expirar, 0 dados de donos ou saldos continuam visíveis ou acessíveis sem
  entrar de novo.
- **SC-006**: As telas da área carregam a lista e o detalhe em até 2 segundos em 95% das vezes no site publicado.
- **SC-007**: A suíte de testes do site roda sem serviço externo, e os testes existentes continuam com o mesmo
  resultado.

## Assumptions

- **Credenciais**: os administradores já existem no serviço (criados pelo script de cadastro); esta feature não cria nem
  altera administradores.
- **Sem renovação de acesso**: o serviço não renova o acesso de admin; ao expirar, entra-se de novo (sem mudar o
  serviço, FR-012).
- **Extrato limitado**: o detalhe mostra as 50 operações mais recentes, que é o que o serviço oferece; paginação do
  extrato fica para outra feature.
- **Banco compartilhado**: hoje o serviço publicado usa o mesmo banco em todos os ambientes (pendência da 010); como a
  área é somente leitura, consultar não altera dados.
- **Fora de escopo**: ajustar saldo, criar/editar administradores, busca de dono por texto, exportar dados, e qualquer
  mudança no admin simulado do marketplace (feature 013).
