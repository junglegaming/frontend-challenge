# Feature Specification: Página de Pagamento (Checkout completo)

**Feature Branch**: `maju`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "Minha parte no projeto é a página de pagamentos (`/checkout`). Completar o fluxo de
Pagamento do desafio: dados do colecionador, seleção de carteira e rede, revisão e envio do pedido."

## Contexto

A spec `002-nft-marketplace-screens` (US4) entregou uma primeira versão de `/checkout`: formulário do
colecionador, escolha de carteira salva, resumo e botão "Confirmar compra" com chave de idempotência. Esta
feature **evolui** essa página até cobrir todos os comportamentos de "Pagamento e confirmação" exigidos em
`docs/CHALLENGE.md` §3, §6, §7 e §9. Lacunas identificadas na versão atual:

- não existe etapa de **revisão** antes do envio;
- a carteira não passa por **conexão simulada** (conectar, recusa, desconexão);
- mudança de preço/disponibilidade apenas mostra um aviso genérico, sem mostrar **o que mudou** nem exigir
  **nova confirmação** explícita;
- alterações recebidas **em tempo real** durante o checkout não bloqueiam a confirmação;
- o envio sempre navega para a confirmação, mesmo quando o pagamento termina **recusado**;
- não há recuperação de **pedido pendente** ao recarregar ou reconectar, nem tratamento de **sessão expirada**
  preservando o que foi preenchido;
- os dados do colecionador não são pré-preenchidos com o perfil.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preencher dados, revisar e confirmar a compra (Priority: P1)

Um colecionador autenticado, com itens no carrinho, abre a página de pagamento, vê seus dados de perfil já
preenchidos, escolhe a rede e uma carteira cadastrada, avança para a revisão do pedido (itens, quantidades,
carteira, rede, subtotal, desconto, taxa de rede e total) e confirma a compra. Ao ser confirmado pela simulação,
é levado ao recibo.

**Why this priority**: é o caminho feliz da monetização; sem ele nenhuma outra história tem valor.

**Independent Test**: com sessão ativa e um item no carrinho (cenário padrão), abrir `/checkout`, completar os
campos, revisar e confirmar; verificar que o recibo do pedido confirmado é exibido e que o item comprado saiu do
carrinho.

**Acceptance Scenarios**:

1. **Given** um colecionador com perfil preenchido, **When** abre a página de pagamento, **Then** nome e e-mail
   aparecem pré-preenchidos e editáveis.
2. **Given** um campo obrigatório vazio ou inválido, **When** o usuário tenta avançar, **Then** o avanço é
   bloqueado, a mensagem de erro aparece junto ao campo e o foco vai para o primeiro campo inválido.
3. **Given** todos os campos válidos e uma carteira conectada, **When** o usuário avança, **Then** vê a revisão
   com todos os itens e valores da cotação atual e pode voltar para editar sem perder o que preencheu.
4. **Given** a revisão aberta, **When** o usuário confirma, **Then** o pedido é enviado uma única vez, o botão
   indica progresso e, quando a simulação confirma o pagamento, o usuário vê o recibo.
5. **Given** um pedido confirmado, **When** o usuário volta ao carrinho, **Then** apenas os itens e quantidades
   comprados foram removidos.

---

### User Story 2 - Conectar carteira e escolher rede (Priority: P1)

Na seção "Carteira e rede", o colecionador escolhe uma de suas carteiras cadastradas (principal ou secundária) ou
cadastra outra, seleciona uma rede compatível e conecta a carteira (simulado). A conexão pode ser aceita,
recusada ou desfeita.

**Why this priority**: o desafio exige o uso das carteiras cadastradas com seleção de rede e simulação de
conexão, recusa e desconexão; sem carteira conectada não há pagamento.

**Independent Test**: no cenário padrão, conectar uma carteira e ver o estado "Conectada"; desconectar e ver o
botão de confirmar bloqueado; no cenário "Carteira recusa conexão", tentar conectar e ver a mensagem de recusa
com opção de tentar de novo.

**Acceptance Scenarios**:

1. **Given** o colecionador tem carteiras cadastradas, **When** abre o pagamento, **Then** vê a lista delas
   (apelido, tipo e endereço abreviado) e a principal vem selecionada.
2. **Given** uma carteira selecionada, **When** escolhe uma rede que a carteira não suporta, **Then** é avisado
   da incompatibilidade e não pode avançar com essa combinação.
3. **Given** uma carteira selecionada, **When** clica em "Conectar", **Then** vê o estado "Conectando…" e depois
   "Conectada", anunciado para leitores de tela.
4. **Given** o cenário de recusa, **When** tenta conectar, **Then** vê "Conexão recusada pela carteira" com a
   opção "Tentar novamente", e a compra continua bloqueada.
5. **Given** uma carteira conectada, **When** clica em "Desconectar" ou troca de carteira, **Then** a conexão é
   desfeita e a confirmação volta a ficar bloqueada até nova conexão.
6. **Given** o colecionador sem carteira cadastrada, **When** abre o pagamento, **Then** pode cadastrar uma
   carteira na própria página e usá-la imediatamente.

---

### User Story 3 - Revalidar valores e exigir nova confirmação (Priority: P1)

Antes de enviar, o sistema revalida preço, disponibilidade, cupom e taxas. Se algo mudou (inclusive por um
evento em tempo real enquanto o usuário está na página), a interface mostra exatamente o que mudou, atualiza o
resumo e exige que o usuário confirme de novo com os valores novos.

**Why this priority**: é critério eliminatório do desafio (§7: "O checkout impede a confirmação com uma cotação
desatualizada") e protege o usuário de pagar um valor que não viu.

**Independent Test**: no cenário "Preço muda no checkout", confirmar a compra e verificar que o pedido não é
criado, que o novo preço e o novo total aparecem destacados e que só após nova confirmação o pedido segue.

**Acceptance Scenarios**:

1. **Given** a revisão aberta, **When** o preço de um item muda antes do envio, **Then** o envio é interrompido,
   o item mostra preço antigo → novo, o total é atualizado e o usuário precisa confirmar de novo.
2. **Given** a página aberta, **When** chega uma atualização em tempo real de preço ou disponibilidade de um item
   do pedido, **Then** a interface avisa a mudança (de forma acessível), atualiza o resumo e invalida qualquer
   revisão já feita.
3. **Given** uma edição esgotou ou a quantidade ficou acima do estoque, **When** o usuário tenta confirmar,
   **Then** a confirmação fica bloqueada com a indicação do item afetado e um caminho para ajustar o carrinho.
4. **Given** o cupom deixou de ser válido, **When** a cotação é revalidada, **Then** o usuário é avisado de que o
   desconto foi removido e vê o novo total antes de confirmar.

---

### User Story 4 - Envio seguro: sem duplicidade, com pedido pendente e recusado (Priority: P2)

O pedido nunca é duplicado, mesmo com cliques repetidos, timeout ou recarga da página. Enquanto o pagamento está
pendente, o usuário vê esse estado; se recusado, continua no pagamento com os itens preservados e pode tentar de
novo; se confirmado, vê o recibo.

**Why this priority**: cobre os cenários de falha obrigatórios (§9 item 7 e 10), mas depende do caminho feliz.

**Independent Test**: nos cenários "Timeout ao criar pedido" e "Pagamento recusado", verificar que existe um
único pedido, que o estado correto é mostrado e que os itens permanecem no carrinho após a recusa.

**Acceptance Scenarios**:

1. **Given** a revisão aberta, **When** o usuário clica várias vezes em confirmar, **Then** apenas um pedido é
   criado.
2. **Given** o envio excede o tempo limite, **When** o usuário tenta novamente, **Then** recupera o mesmo pedido
   em vez de criar outro.
3. **Given** um pedido pendente, **When** o usuário recarrega a página ou a conexão em tempo real cai e volta,
   **Then** vê o mesmo pedido pendente e, quando ele terminar, o resultado final, sem nova compra.
4. **Given** o pagamento foi recusado, **When** o resultado chega, **Then** o usuário vê o motivo da recusa na
   página de pagamento, os itens continuam no carrinho e ele pode tentar novamente (nova tentativa = novo
   pedido).
5. **Given** um pedido confirmado ou recusado, **When** chegam eventos repetidos ou antigos, **Then** o estado
   final não muda.

---

### User Story 5 - Sessão expirada durante o pagamento (Priority: P3)

Se a sessão expirar enquanto o colecionador está no pagamento, ele é levado ao login e, ao entrar de novo, volta
para o pagamento com o que já tinha preenchido.

**Why this priority**: exigido pelo desafio (§3 "Conta e sessão"), mas é um caminho de exceção.

**Independent Test**: no cenário "Sessão curta", preencher o formulário, aguardar a expiração, tentar
confirmar, fazer login e verificar que voltou a `/checkout` com os campos preenchidos.

**Acceptance Scenarios**:

1. **Given** a sessão expirou, **When** o usuário tenta avançar ou confirmar, **Then** é informado e levado ao
   login com retorno para o pagamento.
2. **Given** voltou do login com o mesmo usuário, **When** a página abre, **Then** os dados do colecionador,
   rede e carteira escolhidos são restaurados (a conexão da carteira precisa ser refeita).
3. **Given** voltou do login com **outro** usuário, **When** a página abre, **Then** nenhum dado do usuário
   anterior é exibido.

---

### Edge Cases

- Carrinho vazio ao abrir `/checkout` (acesso direto ou outra aba) → redireciona para o carrinho com aviso.
- Cotação com item não comprável ao abrir a página → mostra o problema e um link para o carrinho; confirmar
  fica bloqueado.
- Falha de rede ao carregar cotação ou carteiras → mensagem de erro com "Tentar novamente", sem perder o
  formulário.
- Sem conexão em tempo real → a página continua funcionando e a revalidação antes do envio continua obrigatória.
- Carteiras principal e secundária já cadastradas → a opção de cadastrar outra não aparece.
- Usuário recarrega a página na etapa de revisão → volta ao formulário preenchido (a revisão deve ser refeita
  com a cotação atual).
- Erro de validação vindo do servidor (ex.: e-mail inválido) → aparece no campo correspondente.
- Valores em ETH com muitas casas decimais → exibidos sem perda de precisão e somando exatamente o total.
- Telas de 390, 768 e 1440 px e zoom de 200% → sem rolagem horizontal nem conteúdo cortado.

## Requirements *(mandatory)*

### Functional Requirements

**Formulário do colecionador**

- **FR-001**: A página MUST exigir autenticação; sem sessão, o usuário vai ao login com retorno ao pagamento.
- **FR-002**: A página MUST exibir os campos do layout: nome de exibição, e-mail, rede, carteira e observação
  opcional; campos obrigatórios MUST ser marcados visualmente e de forma acessível.
- **FR-003**: Nome e e-mail MUST vir pré-preenchidos com os dados do perfil quando existirem.
- **FR-004**: O sistema MUST validar os campos antes de avançar para a revisão, mostrando a mensagem junto ao
  campo e movendo o foco para o primeiro campo inválido; erros de validação do servidor MUST aparecer no campo
  correspondente.

**Carteira e rede**

- **FR-005**: O usuário MUST poder escolher entre suas carteiras cadastradas e cadastrar outra (até o limite de
  principal + secundária) sem sair da página.
- **FR-006**: O usuário MUST escolher uma rede suportada pela carteira selecionada; combinações incompatíveis
  MUST ser sinalizadas e impedir o avanço.
- **FR-007**: O sistema MUST simular a conexão da carteira com os estados desconectada, conectando, conectada e
  recusada, permitindo tentar de novo e desconectar.
- **FR-008**: Trocar de carteira ou de rede MUST desfazer a conexão atual e invalidar a revisão.

**Revisão e revalidação**

- **FR-009**: Antes do envio, o usuário MUST ver uma revisão com itens, edições, quantidades, carteira, rede,
  subtotal, desconto, taxa de rede e total, podendo voltar e editar sem perder dados.
- **FR-010**: O sistema MUST revalidar preço, disponibilidade, cupom e taxas imediatamente antes de criar o
  pedido.
- **FR-011**: Se a revalidação ou um evento em tempo real indicar mudança, o sistema MUST interromper o envio,
  mostrar o que mudou (valor anterior → novo, item esgotado, cupom removido), atualizar o resumo e exigir nova
  confirmação explícita.
- **FR-012**: A confirmação MUST ficar bloqueada enquanto houver item não comprável, carteira desconectada ou
  cotação desatualizada.

**Envio e resultado**

- **FR-013**: Cada tentativa de compra MUST usar uma chave de idempotência; cliques repetidos, reenvios e
  recarga da página MUST recuperar o mesmo pedido e nunca criar outro.
- **FR-014**: Durante o envio o botão MUST indicar progresso e ignorar novos cliques.
- **FR-015**: O sistema MUST representar os estados pedido pendente, confirmado e recusado; confirmado e recusado
  são finais e não regridem com eventos duplicados ou antigos.
- **FR-016**: Um pedido pendente MUST ser recuperado após recarga ou reconexão, sem nova compra.
- **FR-017**: O recibo MUST ser exibido somente para pedido confirmado pela simulação.
- **FR-018**: Em recusa ou falha, os itens MUST permanecer no carrinho e o usuário MUST ver o motivo e poder
  tentar novamente; após confirmação, apenas os itens e quantidades comprados MUST sair do carrinho.

**Sessão, acessibilidade e layout**

- **FR-019**: Se a sessão expirar durante o pagamento, o sistema MUST preservar os dados preenchidos (exceto a
  conexão da carteira) para retomada após novo login do mesmo usuário e MUST descartá-los se outro usuário
  entrar.
- **FR-020**: Mudanças de estado (conexão, mudança de valores, envio, recusa) MUST ser anunciadas de forma
  acessível e não depender apenas de cor.
- **FR-021**: A página MUST seguir o layout do Figma no desktop (formulário à esquerda, resumo e carteira à
  direita) e em coluna única no mobile, sem rolagem horizontal em 390, 768 e 1440 px.
- **FR-022**: Áreas que dependem de dados MUST mostrar skeletons com shimmer que preservem as dimensões e
  respeitem a preferência por movimento reduzido.

### Key Entities

- **Sessão de checkout**: a tentativa de compra em andamento — dados do colecionador, carteira, rede, etapa
  (formulário/revisão/enviando/resultado) e chave de idempotência. Preservada para retomada após login.
- **Dados do colecionador**: nome de exibição, e-mail e observação usados no pedido e no recibo.
- **Carteira**: carteira cadastrada (principal ou secundária) com apelido, tipo, endereço, redes suportadas e
  estado de conexão simulado.
- **Cotação**: itens, preços, cupom, taxa de rede, total e problemas (preço mudou, esgotado, estoque, cupom
  removido); é a referência de valores para confirmar.
- **Pedido**: resultado do envio, com estado pendente/confirmado/recusado, snapshot imutável dos valores e
  motivo de recusa quando houver.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um colecionador com perfil e carteira cadastrados conclui a compra, da abertura do pagamento ao
  recibo, em menos de 1 minuto no cenário padrão.
- **SC-002**: Em 100% das execuções dos cenários de clique repetido, timeout e recarga, existe exatamente um
  pedido por tentativa.
- **SC-003**: Em 100% das execuções do cenário de mudança de preço/esgotamento, nenhum pedido é criado com valores
  que o usuário não confirmou.
- **SC-004**: Em 100% das recusas de pagamento, os itens continuam no carrinho e o usuário consegue tentar de novo
  sem refazer o formulário.
- **SC-005**: A página não apresenta violações críticas de acessibilidade e é totalmente operável por teclado.
- **SC-006**: A página não tem rolagem horizontal em 390, 768 e 1440 px e mantém a regressão visual estável.
- **SC-007**: Após expirar a sessão e fazer login de novo, 100% dos campos preenchidos (exceto conexão da
  carteira) são restaurados.

## Assumptions

- **Escopo restrito à página de Pagamento**: esta feature altera apenas `src/pages/checkout` e
  `e2e/checkout`. Páginas, domínios e mocks de outros times não são modificados; se algo faltar neles, a
  necessidade é registrada e combinada com o time dono antes de qualquer mudança.
- A página continua em `/checkout`, dona do time "maju", consumindo os domínios `cart`, `wallets`, `orders`,
  `checkout`, `auth` e `profile` pela API pública (constitution, princípio I).
- O recibo e a tela de pedido pendente/recusado acessada diretamente continuam pertencendo à página
  `order-confirmation`; esta feature decide **quando** navegar para ela (só com pedido confirmado) e mostra
  pendente/recusado na própria página de pagamento.
- A revisão é uma etapa da mesma página (não uma rota nova); recarregar volta ao formulário preenchido.
- Os campos decorativos do Figma (nome de usuário, nome do perfil, ENS, código de indicação) são somente
  leitura ou omitidos, conforme decisão D2 de `specs/002-nft-marketplace-screens/research.md`.
- Os cenários de mock necessários já existem (`price-change-at-checkout`, `sold-out-at-checkout`,
  `order-timeout`, `payment-declined`, `wallet-rejected`, `short-session`, `realtime-offline`) e são apenas
  usados, não alterados.
- Uma nova tentativa após recusa gera um novo pedido (nova chave), pois o pedido recusado é final.
- Integrações reais de carteira, blockchain e gateway de pagamento estão fora do escopo.
