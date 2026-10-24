# Feature Specification: Conta do colecionador — lista de interesse, arquivos baixados, ofertas, suporte e atividade

**Feature Branch**: `015-account-activity-offers-support`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Colocar atividade, lista de interesse, ofertas, arquivos baixados e suporte no sistema. Os cinco itens já aparecem desabilitados ('Em breve') no menu da conta. Lista de interesse é a página dos Favoritos que já existem. Os dados passam a ser guardados no serviço real (apps/api), por usuário: favoritos, compras confirmadas, ofertas, downloads e chamados de suporte. Atividade é um feed derivado, sem eventos inventados. A decisão das ofertas e a resposta dos chamados são feitas por um administrador. Constituição 1.8.0."

Fatos verificados no repositório (2026-10-24), para situar quem lê:

1. O menu da conta já lista **Atividade, Lista de interesse, Ofertas, Arquivos baixados e Suporte**, todos desabilitados
   com a dica "Em breve". Não existe nenhuma página para eles, e nenhum tem texto, rota ou dado hoje.
2. Os **favoritos** já existem (o coração nos cartões de NFT e na página do NFT), mas só numa simulação do navegador, e
   **não há página** que os liste.
3. Pedidos e catálogo vivem na simulação do site. O serviço real (`apps/api`) hoje só conhece **moedas** e
   administradores; não conhece NFT, pedido, favorito, oferta nem chamado.
4. A constituição **1.8.0** (já em vigor) coloca esses cinco recursos em escopo com dados no serviço real, aceita que o
   serviço **confie no registro de compra enviado pelo site** (porque pedidos e catálogo continuam na simulação) e exige
   que atividade seja **derivada** de dados existentes, nunca inventada.
5. A feature 013 (administração do marketplace, em andamento em outra branch) cuida de pedidos no admin e do menu do
   admin; esta feature **não** muda isso. A 014 está reservada ao perfil do usuário.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lista de interesse (Priority: P1)

O colecionador abre "Lista de interesse" no menu da conta e vê todos os NFTs que marcou com o coração, como cartões que
levam à página de cada NFT. Pode desmarcar um item direto da lista. Os favoritos continuam funcionando como hoje nos
cartões e na página do NFT, e agora **valem em qualquer navegador** em que ele entrar com a mesma conta.

**Why this priority**: É a menor fatia que prova a ligação do site com o serviço real para os dados da conta, e quase
todo o comportamento (marcar e desmarcar) já existe para o usuário.

**Independent Test**: Entrar, favoritar três NFTs, abrir a lista e ver os três; desmarcar um e ver a lista com dois;
recarregar a página (e abrir em outro navegador com a mesma conta) e ver os mesmos dois.

**Acceptance Scenarios**:

1. **Given** um usuário com NFTs favoritados, **When** abre "Lista de interesse", **Then** vê um cartão para cada NFT
   favoritado, com imagem, nome e preço atuais do catálogo.
2. **Given** a lista aberta, **When** desmarca um NFT, **Then** ele some da lista sem recarregar a página, e continua
   desmarcado depois de recarregar.
3. **Given** um usuário sem favoritos, **When** abre a lista, **Then** vê um estado vazio com um caminho para o Mercado.
4. **Given** um NFT favoritado que saiu do catálogo, **When** a lista é aberta, **Then** o item aparece como
   indisponível, com a opção de remover, em vez de quebrar a página.
5. **Given** um visitante sem sessão, **When** abre a rota da lista, **Then** é levado ao login e, depois de entrar,
   volta para a lista.

---

### User Story 2 - Arquivos baixados (Priority: P2)

Depois que um pedido é confirmado, o colecionador abre "Arquivos baixados" e vê os arquivos dos NFTs que comprou. Pode
baixar cada arquivo e ver, na mesma tela, quais já baixou e quando.

**Why this priority**: Entrega o valor do pós-compra (receber o que se comprou) e cria o registro de compras confirmadas
no serviço real, de que ofertas e atividade também dependem.

**Independent Test**: Concluir uma compra até o pedido ficar confirmado, abrir "Arquivos baixados", baixar um arquivo e
ver a data do download; com outra conta, confirmar que a lista está vazia.

**Acceptance Scenarios**:

1. **Given** um pedido confirmado com dois NFTs, **When** o usuário abre "Arquivos baixados", **Then** vê um arquivo para
   cada NFT comprado, com o nome do NFT, o número do pedido e o estado "ainda não baixado".
2. **Given** um arquivo disponível, **When** o usuário o baixa, **Then** o navegador recebe o arquivo e a lista passa a
   mostrar a data e a hora do download.
3. **Given** um pedido pendente ou recusado, **When** o usuário abre a tela, **Then** nenhum arquivo daquele pedido
   aparece.
4. **Given** um usuário que nunca comprou, **When** abre a tela, **Then** vê um estado vazio explicando que os arquivos
   aparecem depois de uma compra confirmada.
5. **Given** dois usuários, **When** cada um abre a tela, **Then** cada um vê apenas os arquivos das próprias compras.

---

### User Story 3 - Ofertas (Priority: P3)

O colecionador faz uma oferta de preço por um NFT, acompanha as suas ofertas com o estado de cada uma e pode cancelar uma
oferta que ainda não foi decidida. Aceitar uma oferta não compra nada sozinho: o estado muda e o usuário vê que a oferta
foi aceita.

**Why this priority**: Acrescenta uma interação nova de valor, mas depende de o site já conseguir identificar o usuário e
os NFTs (US1/US2).

**Independent Test**: Abrir um NFT, fazer uma oferta, ver a oferta como "Pendente" em "Ofertas", cancelá-la e ver
"Cancelada"; repetir o envio do mesmo formulário e confirmar que não nasce uma segunda oferta.

**Acceptance Scenarios**:

1. **Given** a página de um NFT, **When** o usuário informa um valor válido e envia a oferta, **Then** a oferta aparece
   em "Ofertas" com o estado "Pendente", o NFT, o valor e a data.
2. **Given** um valor zero, negativo ou com mais casas decimais do que a moeda permite, **When** o usuário tenta enviar,
   **Then** vê a mensagem de erro no campo e nada é criado.
3. **Given** uma oferta pendente, **When** o usuário a cancela, **Then** o estado passa a "Cancelada" e não pode mais ser
   decidida.
4. **Given** uma oferta pendente, **When** um administrador a aceita ou recusa (US6), **Then** o usuário a vê como
   "Aceita" ou "Recusada" na próxima vez que abre ou atualiza a tela, sem que isso apareça como compra concluída.
5. **Given** um envio repetido por duplo clique ou nova tentativa de rede, **When** os dois envios chegam, **Then**
   existe uma única oferta.
6. **Given** um usuário sem ofertas, **When** abre "Ofertas", **Then** vê um estado vazio com o caminho para o Mercado.
7. **Given** a lista de ofertas, **When** o usuário filtra por estado, **Then** vê só as ofertas daquele estado, e o filtro
   fica no endereço da página.

---

### User Story 4 - Suporte (Priority: P4)

O colecionador abre "Suporte", encontra respostas às dúvidas mais comuns e, se não resolver, abre um chamado com assunto,
categoria e mensagem. Acompanha os seus chamados, lê a resposta do atendimento e pode escrever de novo no mesmo chamado.

**Why this priority**: Independente do restante (não depende de compra nem de oferta), mas só ganha valor completo
quando o atendimento consegue responder (US6).

**Independent Test**: Abrir "Suporte", ler uma pergunta frequente, abrir um chamado, vê-lo na lista como "Aberto" e
abrir seu detalhe; com outra conta, confirmar que o chamado não aparece.

**Acceptance Scenarios**:

1. **Given** a página de suporte, **When** o usuário a abre, **Then** vê perguntas frequentes agrupadas por tema e a
   lista dos seus chamados.
2. **Given** o formulário de novo chamado, **When** o usuário envia assunto, categoria e mensagem válidos, **Then** o
   chamado aparece com o estado "Aberto" e a mensagem enviada.
3. **Given** campos vazios ou acima do limite, **When** o usuário tenta enviar, **Then** vê o erro junto ao campo e nada é
   criado.
4. **Given** um chamado respondido pelo atendimento, **When** o usuário abre o detalhe, **Then** vê a conversa em ordem
   cronológica, com quem escreveu cada mensagem, e o estado "Respondido".
5. **Given** um chamado aberto ou respondido, **When** o usuário escreve uma nova mensagem, **Then** ela entra na conversa e o
   estado volta a "Aberto".
6. **Given** um chamado encerrado, **When** o usuário abre o detalhe, **Then** a conversa é só de leitura.
7. **Given** o endereço do chamado de outro usuário, **When** o usuário tenta abri-lo, **Then** vê "não encontrado", sem
   nenhum dado do chamado.

---

### User Story 5 - Atividade (Priority: P5)

O colecionador abre "Atividade" e vê, do mais recente para o mais antigo, o que aconteceu na conta dele: compras
confirmadas, ofertas feitas e decididas, NFTs favoritados e movimentações de moedas. Cada linha leva à tela de origem.

**Why this priority**: É uma visão que reúne os outros recursos; só tem conteúdo útil depois de US1–US3 e do saldo de
moedas existirem.

**Independent Test**: Favoritar um NFT, fazer uma oferta e comprar moedas; abrir "Atividade" e ver os três eventos, em
ordem, cada um com a data e um link; com conta nova, ver o estado vazio.

**Acceptance Scenarios**:

1. **Given** um usuário que favoritou, ofereceu e comprou moedas, **When** abre "Atividade", **Then** vê um item para cada
   fato, do mais recente para o mais antigo, e **nenhum item que não aconteceu**.
2. **Given** mais itens do que cabem numa página, **When** o usuário chega ao fim da lista, **Then** consegue carregar os
   mais antigos sem repetir nem pular itens.
3. **Given** o filtro por tipo (compras, ofertas, favoritos, moedas), **When** o usuário escolhe um tipo, **Then** vê só os
   itens daquele tipo, e o filtro fica no endereço da página.
4. **Given** um item de atividade, **When** o usuário o escolhe, **Then** vai à tela correspondente (pedido, oferta, NFT ou
   extrato de moedas).
5. **Given** um favorito removido ou uma oferta cancelada, **When** o usuário abre a atividade, **Then** a lista mostra
   apenas o que ainda consta nos dados (a remoção de um favorito apaga o item de favorito; o cancelamento da oferta
   aparece como mudança de estado da oferta).
6. **Given** um usuário novo, **When** abre "Atividade", **Then** vê um estado vazio, sem itens de exemplo.

---

### User Story 6 - Atendimento: decidir ofertas e responder chamados (Priority: P6)

Um administrador entra na área de administração, vê as ofertas pendentes e as aceita ou recusa, e vê os chamados abertos
para responder ou encerrar.

**Why this priority**: Sem essa ponta, as ofertas e os chamados dos usuários nunca mudam de estado; mas é uma área
restrita e pequena, que só faz sentido depois de US3 e US4.

**Independent Test**: Com uma oferta pendente e um chamado aberto de um usuário, entrar como administrador, aceitar a
oferta e responder o chamado; entrar como o usuário e ver "Aceita" e a resposta; tentar as mesmas ações sem ser
administrador e ver o acesso negado.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado, **When** abre a lista de ofertas, **Then** vê as ofertas de todos os usuários,
   com o estado, e pode filtrar pelas pendentes.
2. **Given** uma oferta pendente, **When** o administrador a aceita ou recusa, **Then** o estado muda uma única vez e
   passa a valer para o dono da oferta; decidir de novo uma oferta já decidida é recusado com mensagem clara.
3. **Given** a lista de chamados, **When** o administrador abre um chamado e responde, **Then** a resposta entra na
   conversa identificada como do atendimento e o estado passa a "Respondido".
4. **Given** um chamado, **When** o administrador o encerra, **Then** o usuário o vê como "Encerrado", só de leitura.
5. **Given** um usuário comum ou um visitante, **When** tenta abrir essas telas ou executar essas ações, **Then** o acesso
   é negado e nenhum dado de outros usuários é exposto.

---

### Edge Cases

- O usuário sai da conta ou troca de usuário: nada de lista de interesse, ofertas, downloads, chamados ou atividade do
  usuário anterior continua visível.
- O serviço fica indisponível ou a sessão expira durante qualquer uma das telas: mensagem específica e acessível, com a
  opção de tentar de novo, sem perder o texto que o usuário digitou num formulário.
- O mesmo pedido confirmado é registrado mais de uma vez (reconexão, evento repetido): existe um único registro de compra
  e os arquivos não duplicam.
- Um pedido confirmado cujo registro de compra falhou: o usuário não deve ficar sem seus arquivos; o site tenta registrar
  de novo na próxima vez que o usuário abre "Arquivos baixados".
- Valor de oferta com muitas casas decimais, muito grande ou em notação inválida: rejeitado com mensagem, nunca
  arredondado em silêncio.
- Oferta por um NFT que saiu do catálogo: rejeitada com mensagem clara.
- Dois dispositivos favoritam e desfavoritam o mesmo NFT quase ao mesmo tempo: o resultado final é um dos dois estados,
  nunca um item duplicado.
- Atividade com milhares de itens: carrega por páginas, sem travar a tela.
- Um usuário tenta abrir oferta, chamado ou arquivo de outro usuário pelo endereço: "não encontrado", sem vazar existência.
- Tela aberta em 390, 768 e 1440 px: sem rolagem horizontal indevida, com foco visível e leitura por teclado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O menu da conta MUST tornar utilizáveis os cinco itens (Atividade, Lista de interesse, Ofertas, Arquivos
  baixados e Suporte), cada um levando à sua página, com o item atual destacado; a dica "Em breve" MUST sair deles.
- **FR-002**: Todas as páginas novas MUST exigir sessão do site; sem sessão, levam ao login e voltam à página pretendida.
- **FR-003**: Cada usuário MUST ver e alterar somente os próprios dados (favoritos, compras, arquivos, ofertas,
  chamados e atividade); o identificador do dono MUST vir da sessão e nunca de um campo enviado pelo usuário.
- **FR-004**: A lista de interesse MUST listar os NFTs favoritados do usuário, permitir desmarcar na própria lista e
  tratar item removido do catálogo como indisponível.
- **FR-005**: Os favoritos MUST ser guardados no serviço real, por usuário, e valer entre navegadores e dispositivos; os
  cartões e a página do NFT MUST continuar mostrando e alterando o coração como hoje.
- **FR-006**: Quando um pedido fica confirmado, o site MUST registrar a compra no serviço real, uma única vez por pedido,
  com um retrato imutável do que foi comprado (NFTs, quantidades, valores e data).
- **FR-007**: "Arquivos baixados" MUST listar um arquivo por NFT de cada compra confirmada do próprio usuário, mostrar se
  já foi baixado e quando, e permitir baixar; pedidos pendentes ou recusados MUST NOT gerar arquivos.
- **FR-008**: O arquivo entregue MUST ser identificado como material de demonstração (não há arquivo real de NFT neste
  sistema) e MUST conter ao menos o nome do NFT, o pedido e a data da compra.
- **FR-009**: Cada download MUST ser registrado com data e hora; baixar de novo MUST ser permitido e atualizar o "último
  download".
- **FR-010**: O usuário MUST poder fazer uma oferta de preço por um NFT do catálogo, informando um valor positivo dentro
  das casas decimais da moeda; valores inválidos MUST ser rejeitados com mensagem no campo.
- **FR-011**: Cada oferta MUST ter estado explícito entre Pendente, Aceita, Recusada e Cancelada; só uma oferta pendente
  pode mudar de estado, e MUST mudar uma única vez.
- **FR-012**: O envio de uma oferta MUST ser seguro contra repetição (duplo clique, nova tentativa): o mesmo envio nunca
  cria duas ofertas.
- **FR-013**: O usuário MUST poder cancelar uma oferta pendente e listar as próprias ofertas, filtrando por estado, com o
  filtro e a página no endereço.
- **FR-014**: Aceitar uma oferta MUST NOT aparentar compra ou liquidação: nenhuma tela diz que o NFT foi comprado, e nenhum
  pedido ou débito é criado por causa disso.
- **FR-015**: "Suporte" MUST mostrar perguntas frequentes por tema e permitir abrir um chamado com assunto, categoria e
  mensagem, dentro de limites de tamanho que a tela comunica.
- **FR-016**: O usuário MUST poder listar os próprios chamados com estado (Aberto, Respondido, Encerrado), abrir o
  detalhe com a conversa em ordem cronológica e escrever novas mensagens enquanto o chamado não estiver encerrado.
- **FR-017**: "Atividade" MUST ser um feed somente leitura, do mais recente ao mais antigo, montado apenas a partir de
  fatos que existem nos dados do usuário (compras confirmadas, ofertas, favoritos e movimentações de moedas); MUST NOT
  mostrar evento que não aconteceu e MUST NOT ter dados de exemplo.
- **FR-018**: O feed MUST ser paginado sem repetir nem pular itens, permitir filtrar por tipo (com o filtro no endereço) e
  levar cada item à tela de origem.
- **FR-019**: A área de administração MUST permitir a um administrador listar ofertas (com filtro por estado) e aceitar ou
  recusar uma oferta pendente, e listar chamados, responder e encerrar.
- **FR-020**: Essas ações de administrador MUST exigir o papel de administrador; usuários comuns e visitantes MUST receber
  acesso negado, e as ações MUST NOT existir fora desse papel.
- **FR-021**: Todas as telas novas MUST ter estados de carregamento (com a forma da tela preservada), vazio, erro e
  sucesso, e MUST funcionar em 390, 768 e 1440 px com navegação por teclado e foco visível.
- **FR-022**: Em desenvolvimento e nos testes automáticos, as telas MUST funcionar com uma simulação do serviço que se
  comporta como o serviço real (mesmos contratos, mesmas falhas), sem exigir o serviço real no ar.
- **FR-023**: A limitação de que o serviço **confia no registro de compra enviado pelo site** MUST ficar documentada onde
  o serviço é descrito e MUST NOT ser apresentada como verificação do pedido.
- **FR-024**: A documentação de escopo do desafio (`docs/CHALLENGE.md`) MUST deixar de listar atividade, ofertas, downloads
  e suporte como fora da entrega, alinhada à constituição 1.8.0.
- **FR-025**: A feature MUST NOT alterar o comportamento das moedas, do checkout, do catálogo nem da administração do
  marketplace (013) além do necessário para registrar a compra confirmada e ler favoritos do serviço real.

### Key Entities *(include if feature involves data)*

- **Favorito**: o fato de um usuário ter marcado um NFT; identifica o dono, o NFT e quando foi marcado. Um NFT aparece uma
  vez por usuário.
- **Compra confirmada**: retrato imutável de um pedido confirmado do usuário (itens, quantidades, valores, data), com o
  número do pedido como identidade única.
- **Arquivo de NFT**: o material entregue por NFT de uma compra confirmada; tem nome, pedido de origem e o histórico de
  downloads.
- **Download**: o registro de que o usuário baixou um arquivo, com data e hora.
- **Oferta**: proposta de preço de um usuário por um NFT; tem valor (decimal em texto), retrato do NFT na hora da oferta,
  estado (Pendente, Aceita, Recusada, Cancelada), data de criação e data da decisão.
- **Chamado**: pedido de ajuda de um usuário; tem assunto, categoria, estado (Aberto, Respondido, Encerrado) e uma
  conversa.
- **Mensagem do chamado**: cada texto da conversa, com autor (usuário ou atendimento), conteúdo e data.
- **Item de atividade**: linha derivada do feed (não é guardada): tipo, data, descrição e a tela de origem.
- **Administrador**: papel que já existe no serviço; passa a poder decidir ofertas e atender chamados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário consegue encontrar, a partir do menu da conta, qualquer uma das cinco áreas em até 2 toques ou
  cliques, e 0 itens do menu da conta continuam marcados como "Em breve".
- **SC-002**: Um favorito marcado em um navegador aparece na lista de interesse de outro navegador, com a mesma conta,
  em até 5 segundos depois de a página ser aberta.
- **SC-003**: Em 100% dos pedidos confirmados, cada NFT comprado vira exatamente um arquivo disponível, e em 100% dos
  pedidos pendentes ou recusados nenhum arquivo aparece.
- **SC-004**: Em 100% das tentativas, repetir o mesmo envio de oferta (duplo clique ou nova tentativa) resulta em uma
  única oferta.
- **SC-005**: 0 telas mostram uma oferta aceita como compra concluída, e 0 pedidos ou débitos nascem de uma oferta aceita.
- **SC-006**: Em 100% das tentativas de um usuário ler dado de outro (ofertas, chamados, arquivos, favoritos ou atividade)
  o resultado é "não encontrado" ou acesso negado, sem nenhum dado exposto; 0 ações de administrador funcionam sem o papel.
- **SC-007**: Cada item do feed de atividade corresponde a um fato verificável nos dados do usuário: 0 itens sem origem
  em um conjunto de teste conhecido, e 100% dos fatos do conjunto aparecem, sem repetição ao paginar.
- **SC-008**: Um usuário consegue abrir um chamado e uma pessoa do atendimento consegue respondê-lo, com o usuário vendo a
  resposta, em menos de 3 minutos de interação ponta a ponta.
- **SC-009**: Cada página nova carrega a lista inicial em até 2 segundos em 95% das vezes no site publicado, e nenhuma
  apresenta rolagem horizontal indevida em 390, 768 e 1440 px.
- **SC-010**: A suíte de testes do site roda sem o serviço real no ar, e os testes existentes (moedas, carteiras,
  pedidos) continuam passando com o mesmo resultado.

## Assumptions

- A identidade do dono vem da sessão do site e é aceita pelo serviço real do mesmo modo que as moedas hoje (o serviço
  confia no identificador pedido na emissão do acesso; limitação já documentada, constituição 1.8.0).
- "Lista de interesse" e "Favoritos" são a mesma coisa: não existe segundo modelo (alvo de preço, aviso de queda etc.
  estão fora de escopo).
- O catálogo continua na simulação do site; o serviço real guarda só o identificador do NFT e um retrato (nome, imagem,
  preço) quando precisa preservar o que existia na hora (compra e oferta).
- Os arquivos baixados são de demonstração, gerados na hora do download; não há armazenamento de arquivos de NFT.
- **A confirmar em `/speckit-clarify`** (cada um tem um padrão adotado até lá):
  - Quem decide as ofertas: padrão adotado é **o administrador** (US6), como vendedor de demonstração, e não uma regra
    automática.
  - O que acontece depois de uma oferta aceita: padrão adotado é **só mudar o estado** (FR-014), sem levar ao checkout.
  - Downloads: padrão adotado é **um registro por download**, com o "último download" mostrado por arquivo (FR-009).
- Administradores usam o acesso de administrador que já existe no serviço real, separado da sessão do site (como na
  feature 012); as telas de administração desta feature entram na área de administração já existente.
- Atividade não inclui eventos de pedidos pendentes, de navegação nem de suporte; só os quatro tipos de FR-017.
- Moeda e formato de valor das ofertas seguem o que o catálogo já usa (valor decimal em texto, mesmas casas decimais).
- Dependências: a constituição 1.8.0 (em vigor); o serviço de moedas atual (feed de moedas); o checkout e os pedidos da
  simulação (origem das compras confirmadas); a feature 013 muda o menu e a área do admin em paralelo, então conflitos de
  menu e de área do admin devem ser resolvidos na hora de juntar as branches.
- Fora de escopo: pagamento ou liquidação real de oferta, arquivos reais de NFT, notificações por e-mail ou
  push, anexos em chamados, avaliação do atendimento, busca dentro do suporte e páginas editoriais.
