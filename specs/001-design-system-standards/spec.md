# Feature Specification: Padrões do Design System (Kurio)

**Feature Branch**: `001-design-system-standards`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Defina os padrões de acordo com a imagem, acessibilidade, espaçamento, responsividade e cores. Crie padrões de reaproveitamento de cores, componentes e fontes. Pegue tudo da imagem associada."

**Referência visual**: `reference-profile-screen.png` (tela "Perfil do colecionador", desktop 1440 px, tema escuro).

## Visão geral da referência

A imagem mostra a tela "Perfil do colecionador" da marca **KURIO**. Dela derivam-se os padrões abaixo:

- **Cores**: fundo marrom-escuro quase preto; superfícies (menu lateral) marrom um tom mais claro; texto de destaque, ícones, itens de navegação e botões em âmbar/cobre; texto de corpo e rótulos em branco; bordas finas marrom-avermelhadas; asterisco de campo obrigatório em coral; selo de contagem do carrinho em âmbar.
- **Tipografia**: uma única família monoespaçada em toda a interface, em três níveis visíveis: título de página/seção em negrito, rótulos e texto de corpo em peso regular, e texto de ação/botão em negrito.
- **Componentes**: cabeçalho com logotipo, navegação principal (item ativo com sublinhado âmbar), busca, carrinho com selo numérico e botão primário "Entrar"; menu lateral com item ativo marcado por barra vertical âmbar; campos de texto com rótulo e marcador de obrigatório; seletor de sufixo (".eth"); campo de senha com botão de mostrar/ocultar; avatar circular com botões "Alterar" (primário) e "Remover" (texto); botão primário "Salvar".
- **Espaçamento e layout**: contêiner centralizado com margens laterais amplas, duas colunas (menu lateral + conteúdo), formulário em duas colunas, ritmo vertical constante entre rótulo, campo e próximo grupo.

## Clarifications

### Session 2026-10-14

- Q: Esta feature só define os padrões ou também os aplica às telas existentes? → A: Define os padrões e os aplica a **todas** as telas existentes ("use todas as opções" + "padronize todas as telas").
- Decisão do usuário: a paleta oficial tem exatamente 6 cores base: `#140D0A`, `#241612`, `#D28A4C`, `#B39463`, `#F5F1EB`, `#CFB28C` (o pedido dizia "fontes"; interpretado como cores).
- Decisão do usuário: definir um conjunto padrão de ícones, uma barra de navegação (navbar) e um "dook" (interpretado como **dock**: barra de navegação fixa inferior para telas pequenas).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aparência consistente em todas as telas (Priority: P1)

Como colecionador, quero que todas as telas tenham as mesmas cores, fontes e componentes para reconhecer a marca e usar qualquer tela sem reaprender a interface.

**Why this priority**: é a base visual de todas as páginas; sem ela cada time cria estilos próprios e o produto fica inconsistente.

**Independent Test**: comparar a tela de perfil implementada com a imagem de referência e percorrer as demais telas conferindo que usam as mesmas cores, fonte e componentes.

**Acceptance Scenarios**:

1. **Given** a tela de perfil, **When** comparada com a imagem de referência em 1440 px, **Then** cores, fonte, tamanhos relativos, bordas e posicionamento dos elementos são equivalentes.
2. **Given** qualquer outra tela do produto, **When** exibida, **Then** usa a mesma paleta, a mesma família tipográfica e os mesmos componentes (botões, campos, navegação) da referência.
3. **Given** uma mudança no valor de uma cor da paleta, **When** aplicada em um único lugar, **Then** todas as telas refletem a mudança sem edições adicionais.

---

### User Story 2 - Formulários claros e acessíveis (Priority: P1)

Como colecionador (inclusive usando teclado ou leitor de tela), quero preencher formulários com rótulos visíveis, campos obrigatórios identificados e erros compreensíveis.

**Why this priority**: perfil, cadastro, login, carteiras e checkout dependem de formulários; acessibilidade é requisito obrigatório do projeto.

**Independent Test**: preencher o formulário de perfil só com teclado e com leitor de tela, deixando campos obrigatórios vazios.

**Acceptance Scenarios**:

1. **Given** um campo obrigatório, **When** exibido, **Then** o rótulo mostra o marcador de obrigatório em coral e a obrigatoriedade também é indicada por texto acessível (não apenas por cor).
2. **Given** um campo com erro, **When** a validação falha, **Then** uma mensagem de texto associada ao campo é exibida, com cor e ícone/texto que não dependem só da cor.
3. **Given** o usuário navegando por teclado, **When** o foco entra em qualquer controle, **Then** há um indicador de foco visível com contraste suficiente sobre o fundo escuro.
4. **Given** um campo de senha, **When** o usuário aciona o botão de mostrar/ocultar, **Then** o estado é anunciado e o botão tem nome acessível.

---

### User Story 3 - Layout responsivo (Priority: P2)

Como colecionador, quero usar o produto no celular, tablet e desktop sem perder conteúdo ou funções.

**Why this priority**: o desafio exige 390, 768 e 1440 px; a referência cobre apenas desktop, então os padrões precisam definir a adaptação.

**Independent Test**: abrir a tela de perfil em 390, 768 e 1440 px e conferir leiaute, rolagem e alvos de toque.

**Acceptance Scenarios**:

1. **Given** largura de 1440 px, **When** a tela de perfil é exibida, **Then** aparece o menu lateral ao lado do formulário em duas colunas, como na referência.
2. **Given** largura de 768 px, **When** exibida, **Then** o menu lateral deixa de ocupar coluna fixa se faltar espaço e o formulário mantém no máximo duas colunas legíveis.
3. **Given** largura de 390 px, **When** exibida, **Then** o conteúdo ocupa uma coluna, a navegação principal fica acessível por menu compacto, e não há rolagem horizontal.
4. **Given** zoom de 200%, **When** a tela é exibida, **Then** nenhum conteúdo é cortado ou sobreposto.

---

### User Story 4 - Reaproveitamento por times (Priority: P2)

Como desenvolvedor de uma página, quero usar tokens e componentes padronizados em vez de recriar estilos, para entregar telas novas rapidamente e consistentes.

**Why this priority**: vários times trabalham em páginas separadas; reaproveitamento evita divergência e retrabalho.

**Independent Test**: construir uma tela nova usando apenas os padrões documentados, sem cores, fontes ou espaçamentos avulsos.

**Acceptance Scenarios**:

1. **Given** um desenvolvedor criando uma tela, **When** consulta o catálogo de padrões, **Then** encontra nomes, uso e estados de cada cor, nível tipográfico, espaçamento e componente.
2. **Given** um componente compartilhado, **When** usado em duas páginas, **Then** aparece idêntico nas duas, com todos os estados previstos (padrão, foco, desabilitado, erro, carregando).
3. **Given** uma cor ou fonte fora do catálogo, **When** introduzida em uma tela, **Then** a revisão a identifica como desvio do padrão.

---

### Edge Cases

- Textos longos em português (rótulos, mensagens de erro) em 390 px: devem quebrar linha sem cortar nem estourar o contêiner.
- Fonte monoespaçada indisponível ou ainda carregando: a tela deve permanecer legível com fonte monoespaçada substituta, sem deslocamento perceptível do leiaute.
- Usuário com preferência de movimento reduzido: animações (carregamento, transições) devem ser suprimidas ou simplificadas.
- Usuário com preferência por contraste alto ou zoom de texto: layout continua utilizável.
- Contagem do carrinho com mais de um dígito (por exemplo, 99+): selo permanece legível e não sobrepõe o ícone.
- Item de menu lateral com rótulo longo ou item ativo e em foco ao mesmo tempo: ambos os estados permanecem distinguíveis.

## Requirements *(mandatory)*

### Functional Requirements

**Cores**

- **FR-001**: O produto MUST definir uma paleta nomeada por função (fundo, superfície, texto principal, texto secundário, destaque/primária, borda, campo obrigatório/erro, sucesso, aviso, foco) cujas cores base são exatamente `#140D0A` (fundo), `#241612` (superfície), `#D28A4C` (destaque/primária), `#B39463` (texto secundário e bordas), `#F5F1EB` (texto principal) e `#CFB28C` (foco e realces claros). Cores de estado (erro, sucesso, aviso) MAY ser adicionadas, desde que nomeadas e documentadas.
- **FR-002**: Cada cor MUST ser definida uma única vez e reutilizada por nome em todas as telas; nenhuma tela MUST usar valor de cor avulso.
- **FR-003**: Todas as combinações de texto e fundo da paleta MUST ter contraste mínimo de 4,5:1 (3:1 para texto grande e para componentes de interface e indicadores de foco).
- **FR-004**: Estados (ativo, erro, sucesso, desabilitado) MUST ser comunicados também por texto, ícone ou forma, nunca apenas por cor.

**Tipografia**

- **FR-005**: O produto MUST usar uma família tipográfica monoespaçada única, conforme a referência, em toda a interface, com uma substituta monoespaçada definida.
- **FR-006**: MUST existir uma escala tipográfica nomeada, com ao menos: título de seção (negrito), título de bloco (negrito), rótulo/corpo (regular), texto de ação/botão (negrito) e texto auxiliar; cada nível com tamanho, peso e altura de linha definidos.
- **FR-007**: O texto de corpo MUST ter tamanho mínimo de 14 px e permitir ampliação de 200% sem perda de conteúdo.

**Espaçamento e leiaute**

- **FR-008**: MUST existir uma escala de espaçamento nomeada, e todo espaçamento, margem e vão entre elementos MUST usar valores dessa escala.
- **FR-009**: Raios de borda, espessura de bordas e alturas de controles (campos, botões) MUST seguir valores padronizados extraídos da referência: bordas finas, cantos suavemente arredondados e campos/botões de altura uniforme.
- **FR-010**: O conteúdo MUST ficar em um contêiner centralizado com largura máxima e margens laterais padronizadas, e o ritmo vertical entre rótulo, campo e grupo seguinte MUST ser constante.

**Responsividade**

- **FR-011**: Todos os padrões MUST funcionar em 390, 768 e 1440 px, com pontos de quebra nomeados e regras de adaptação definidas para: navegação principal, menu lateral, formulários em colunas e cabeçalho.
- **FR-012**: Nenhuma tela MUST apresentar rolagem horizontal indevida em nenhuma dessas larguras.
- **FR-013**: Alvos interativos MUST ter no mínimo 44 × 44 px em telas de toque.

**Acessibilidade**

- **FR-014**: Todo controle interativo MUST ser operável por teclado, com ordem de foco lógica e indicador de foco visível.
- **FR-015**: Campos MUST ter rótulo visível associado programaticamente; campos obrigatórios MUST ser identificados por texto acessível além do marcador visual; mensagens de erro MUST ser associadas ao campo e anunciadas.
- **FR-016**: Botões somente com ícone (busca, carrinho, mostrar/ocultar senha, avatar) MUST ter nome acessível; o selo do carrinho MUST informar a quantidade de itens em texto acessível.
- **FR-017**: A navegação MUST indicar o item atual de forma programática e visual (sublinhado/barra âmbar na referência).
- **FR-018**: Animações MUST respeitar a preferência de movimento reduzido.

**Componentes reutilizáveis**

- **FR-019**: MUST existir um catálogo dos componentes presentes na referência, cada um com variantes e estados documentados: botão primário, botão de texto, botão com ícone, campo de texto, campo de senha com mostrar/ocultar, campo com seletor de sufixo, rótulo com marcador de obrigatório, avatar com ações, item de menu lateral (padrão/ativo/foco), item de navegação principal (padrão/ativo), selo de contagem, cabeçalho e painel lateral.
- **FR-020**: Cada componente MUST prever estados padrão, foco, ativo, desabilitado, erro e carregando (quando aplicável).
- **FR-021**: Componentes usados por mais de uma página MUST existir uma única vez e ser compartilhados; páginas MUST NOT duplicar a aparência de um componente do catálogo.
- **FR-022**: Estados de carregamento MUST usar o padrão de esqueleto com efeito de brilho, preservando as dimensões do conteúdo final.
- **FR-024**: MUST existir um conjunto padrão de ícones, de uma única família visual, com tamanhos e espessura de traço padronizados, herdando a cor do texto; ícones decorativos MUST ser ocultos para tecnologia assistiva e ícones que carregam significado MUST ter nome acessível.
- **FR-025**: MUST existir uma navbar única, compartilhada por todas as telas, com logotipo, itens de navegação (item atual indicado), busca, carrinho com selo de quantidade e entrada/conta; itens sem destino implementado MUST aparecer desabilitados e nunca como links funcionais.
- **FR-026**: Em telas pequenas (390 px), MUST existir uma dock fixa inferior com os destinos principais, com alvos de toque de no mínimo 44 × 44 px, item atual indicado, sem cobrir o conteúdo final da página; a navbar superior MUST manter apenas logotipo e ações essenciais.
- **FR-027**: Todas as telas existentes do produto MUST ser padronizadas com a paleta, a tipografia, o espaçamento, os ícones, a navbar, a dock e os componentes do catálogo; nenhuma tela MUST manter estilo próprio.
- **FR-023**: MUST existir uma regra de revisão: qualquer cor, fonte, espaçamento ou componente fora do catálogo exige justificativa registrada e, se aprovado, entra no catálogo.

### Key Entities *(include if feature involves data)*

- **Token de cor**: nome funcional, valor, uso previsto e pares de texto/fundo permitidos com seu contraste.
- **Nível tipográfico**: nome, família, tamanho, peso, altura de linha e uso.
- **Token de espaçamento**: nome e valor da escala.
- **Ponto de quebra**: nome, largura e regras de adaptação associadas.
- **Ícone padrão**: nome, finalidade, tamanho e se é decorativo ou significativo.
- **Componente padrão**: nome, finalidade, variantes, estados, requisitos de acessibilidade e comportamento responsivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A tela de perfil, comparada lado a lado com a imagem de referência em 1440 px, apresenta 100% dos elementos visíveis (cabeçalho, menu lateral, campos, avatar, botões) com cores, fonte e posicionamento equivalentes, aprovada em revisão visual.
- **SC-002**: 100% das cores, níveis tipográficos e espaçamentos usados nas telas pertencem ao catálogo; zero valores avulsos encontrados em revisão.
- **SC-003**: 100% dos pares de texto/fundo e indicadores de foco atingem o contraste mínimo definido (4,5:1 ou 3:1 conforme o caso).
- **SC-004**: Todas as telas funcionam em 390, 768 e 1440 px sem rolagem horizontal e sem perda de conteúdo, inclusive com zoom de 200%.
- **SC-005**: Todo formulário é concluído apenas com teclado, sem armadilhas de foco, e uma auditoria automatizada de acessibilidade não reporta falhas críticas.
- **SC-006**: Uma mudança de cor ou fonte da marca em um único ponto altera 100% das telas.
- **SC-008**: 100% das telas existentes exibem a mesma navbar (e a dock em 390 px), com o item atual indicado corretamente em cada uma.
- **SC-007**: Um desenvolvedor monta uma tela nova de formulário usando apenas componentes do catálogo, sem criar estilos novos, em um dia de trabalho ou menos.

## Assumptions

- A imagem `reference-profile-screen.png` é a fonte de verdade visual; valores exatos de cor e tamanho serão medidos dela, e onde ela não mostra algo (tablet, mobile, estados de erro, foco, desabilitado) os padrões seguem o mesmo estilo visual.
- Existe somente o tema escuro; tema claro está fora do escopo.
- A referência é apenas de desktop; os comportamentos de tablet e mobile serão definidos pelas regras desta especificação.
- Os valores provisórios de tokens já existentes no projeto serão revisados contra a imagem e substituídos quando divergirem.
- Idioma da interface: português do Brasil.
- Itens de menu da referência sem tela prevista no desafio (Atividade, Lista de interesse, Ofertas, Arquivos baixados, Suporte) são tratados aqui apenas como exemplo visual do componente de menu; as telas em si estão fora do escopo desta especificação.
- "Todas as telas" significa todas as rotas existentes e as já previstas em `docs/TEAMS.md`; telas ainda não implementadas recebem o padrão quando forem construídas, e seus esqueletos/estados de erro e 404 também entram.
- Os padrões complementam, sem substituir, as regras de acessibilidade e responsividade já previstas em `docs/CHALLENGE.md` e na constituição do projeto.
