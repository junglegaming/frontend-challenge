# Feature Specification: Moedas do site usando o back-end real

**Feature Branch**: `011-web-coins-real-api`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Usar o back-end real (apps/api) no front-end (apps/web): as telas de moedas (saldo e recarga na carteira, pagar com moedas no checkout) passam a usar a API real via /backend em desenvolvimento (mock por padrão) e em produção (API real), substituindo o cliente antigo do server/ (006), que fica escondido em produção hoje. Estorno de pedido que falha = crédito de volta com chave de idempotência derivada da chave do pedido (sem mudar a API); toda escrita envia chave de idempotência; 402 = saldo insuficiente, 409 = conflito de chave (não repetir); o cliente antigo é aposentado, server/ não é tocado. Limitação: a emissão de token confia no identificador do dono, então as moedas de produção são de demonstração. Fora de escopo: admin da API."

Fatos verificados no repositório (2026-10-24), para situar quem lê:

1. O serviço de moedas real (o back-end da 010) já está publicado e o site já o alcança pelo próprio domínio, no caminho
   `/backend`. Nenhuma tela o usa.
2. As telas de moedas atuais (saldo e recarga na carteira; "pagar com moedas" no checkout) falam com o serviço antigo da
   006, que só existe em desenvolvimento; **em produção essas telas ficam escondidas**.
3. Já existe no site um módulo cliente pronto para o serviço real (feito na 007), com testes contra simulação, mas sem tela
   que o use. Ele ainda repete automaticamente pedidos que voltam com "conflito", algo que o serviço real deixou de usar
   para concorrência: hoje "conflito" significa "chave de operação reutilizada com outro valor" e não deve ser repetido.
4. Os dois serviços divergem: o antigo indica saldo insuficiente com um código e devolve o saldo num campo com outro nome;
   o real usa "pagamento necessário" (402) para saldo insuficiente, não tem operação de estorno e aceita uma chave de
   idempotência opcional por operação.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver e recarregar o saldo de moedas, inclusive no site publicado (Priority: P1)

Uma pessoa logada abre a carteira, vê o saldo real de moedas e faz uma recarga; o saldo novo aparece na hora e continua
lá ao recarregar a página ou voltar depois. Isso funciona no site publicado, não só em desenvolvimento.

**Why this priority**: É a menor fatia que prova a ligação site → serviço real e devolve a funcionalidade de moedas a
quem usa o site publicado, onde hoje ela está escondida.

**Independent Test**: No site publicado, logar, abrir a carteira, recarregar um valor e conferir que o saldo e o
histórico mostram a operação, inclusive após recarregar a página.

**Acceptance Scenarios**:

1. **Given** uma pessoa logada sem moedas, **When** abre a carteira, **Then** vê saldo `0` (não erro, não tela vazia
   sem explicação) e a opção de recarregar.
2. **Given** uma recarga válida, **When** a pessoa confirma, **Then** o saldo mostrado aumenta exatamente o valor
   recarregado e a operação aparece no histórico.
3. **Given** uma recarga em andamento, **When** a resposta demora ou a conexão cai e a pessoa tenta de novo, **Then** a
   recarga é aplicada **uma única vez**.
4. **Given** o serviço de moedas indisponível, **When** a pessoa abre a carteira, **Then** vê uma mensagem clara de
   indisponibilidade com opção de tentar de novo, e o resto do site continua funcionando.
5. **Given** duas pessoas diferentes, **When** cada uma consulta sua carteira, **Then** nenhuma vê o saldo ou o histórico
   da outra; ao sair e entrar com outra conta, nada da conta anterior aparece.

---

### User Story 2 - Pagar um pedido com moedas (Priority: P2)

No checkout, a pessoa escolhe pagar com moedas. Se houver saldo, o valor é descontado e o pedido é criado; se não houver,
ela é avisada antes de qualquer cobrança; se o pedido falhar depois do desconto, as moedas voltam.

**Why this priority**: É o uso de valor das moedas, mas depende de a ligação com o serviço real (US1) existir.

**Independent Test**: Com saldo suficiente, finalizar um pedido pagando com moedas e conferir saldo e histórico; repetir
com saldo insuficiente e com uma falha forçada na criação do pedido.

**Acceptance Scenarios**:

1. **Given** saldo suficiente, **When** a pessoa confirma o pagamento com moedas, **Then** o saldo diminui exatamente o
   valor do pedido em moedas e o pedido é criado.
2. **Given** saldo insuficiente, **When** a pessoa confirma, **Then** recebe a mensagem "saldo insuficiente" com o saldo
   atual e o valor necessário, nenhum pedido é criado e nada é descontado.
3. **Given** o desconto já feito, **When** a criação do pedido é recusada (por exemplo, a edição esgotou), **Then** o mesmo valor volta ao saldo **uma única
   vez**, a pessoa é informada, e o histórico mostra o desconto e a devolução.
4. **Given** a pessoa clica duas vezes ou repete a confirmação após um erro de rede, **When** as tentativas chegam ao
   serviço, **Then** o desconto acontece **uma única vez** para aquele pedido.
5. **Given** a devolução também falha (serviço indisponível), **When** isso acontece, **Then** a pessoa vê uma mensagem
   explícita de que as moedas ainda não voltaram, e uma nova tentativa não devolve em dobro.

---

### User Story 3 - Desenvolver e testar sem depender do serviço publicado (Priority: P3)

Quem desenvolve o site roda e testa as telas de moedas com a simulação local, que se comporta como o serviço real
(inclusive repetição de operações e recusas), e pode, por configuração, apontar para um serviço real local ou publicado.

**Why this priority**: Garante que US1/US2 sejam verificáveis de forma determinística e que a simulação não esconda
diferenças em relação ao serviço real.

**Independent Test**: Rodar a suíte de testes do site sem nenhum serviço externo no ar; todos os cenários de moedas
passam. Trocar a configuração para o serviço real local e repetir os mesmos fluxos manualmente.

**Acceptance Scenarios**:

1. **Given** a simulação ligada, **When** os testes de carteira e checkout rodam, **Then** passam sem acesso de rede a
   nenhum serviço externo.
2. **Given** a mesma operação repetida com a mesma chave, **When** chega à simulação, **Then** o resultado é o mesmo do
   serviço real (um efeito; mesma chave com outro valor ⇒ conflito; chave inválida ⇒ erro de entrada).
3. **Given** a versão de produção do site, **When** é construída, **Then** não contém endereço de serviço local e todas
   as chamadas de moedas vão para o caminho `/backend` do próprio site.

---

### Edge Cases

- **Conflito de chave** (mesma chave de operação com valor ou tipo diferente): MUST ser mostrado como erro e MUST NOT ser
  repetido automaticamente.
- **Sessão expirada no meio de uma operação de moedas**: a credencial de moedas MUST ser renovada uma vez de forma
  transparente; se ainda falhar, a pessoa vê erro claro (sem perder o estado da tela).
- **Troca de conta / logout**: credenciais e dados de moedas da conta anterior MUST ser descartados.
- **Valor do pedido não inteiro em moedas**: a conversão do preço para moedas MUST seguir a regra existente (arredondar
  para cima), igual na tela e na cobrança.
- **Serviço de moedas lento**: estados de carregamento visíveis; nenhuma ação duplicada por impaciência.
- **Pedido criado, mas a resposta se perde**: repetir a confirmação MUST NOT gerar segundo desconto nem segundo pedido, e
  MUST NOT devolver as moedas (o pedido pode existir).
- **Recompra depois de uma devolução**: tentar de novo a mesma compra depois que as moedas foram devolvidas MUST descontar
  de novo (nunca criar o pedido sem cobrar).
- **Pessoa não logada**: as telas de moedas não aparecem (como as demais áreas que exigem conta).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A carteira MUST mostrar o saldo de moedas da pessoa logada vindo do serviço real (ou da simulação, conforme
  a configuração do ambiente), em desenvolvimento **e** no site publicado.
- **FR-002**: A pessoa MUST poder recarregar moedas na carteira; o saldo exibido MUST refletir a recarga sem recarregar a
  página e permanecer correto após recarregá-la.
- **FR-003**: A carteira MUST mostrar o histórico recente de operações de moedas da pessoa (mais recentes primeiro).
- **FR-004**: Toda operação que altera saldo (recarga, desconto, devolução) MUST levar uma chave de operação única, de modo
  que repetir a mesma ação (clique duplo, nova tentativa após timeout) produza **um único efeito**.
- **FR-005**: No checkout, a pessoa MUST poder pagar com moedas: desconto do valor do pedido convertido em moedas, depois
  criação do pedido. A chave do desconto MUST derivar da chave do próprio pedido.
- **FR-006**: Saldo insuficiente MUST ser comunicado antes de criar o pedido, sem desconto e sem pedido criado.
- **FR-007**: Se a criação do pedido for **recusada de forma definitiva** após o desconto (o sistema de pedidos respondeu
  que não criou o pedido), o mesmo valor MUST ser devolvido ao saldo como um crédito com chave derivada da chave do pedido
  (no máximo uma devolução por pedido), e a pessoa MUST ser informada do resultado. Depois de uma devolução, a próxima
  tentativa de compra MUST usar uma chave de pedido nova (para que o desconto seja feito de novo, e não "repetido" sem
  cobrar). Se a falha for **ambígua** (sem resposta, tempo esgotado ou erro do servidor, em que o pedido pode ter sido
  criado), as moedas MUST NOT ser devolvidas: a pessoa é orientada a tentar de novo, e a nova tentativa reaproveita as
  mesmas chaves (o desconto e o pedido são repetidos sem novo efeito).
- **FR-008**: "Conflito de chave" MUST ser tratado como erro final (sem repetição automática); repetições automáticas MUST
  se limitar a falhas de rede ou do servidor.
- **FR-009**: O saldo e o histórico MUST ser isolados por pessoa, e trocar de conta ou sair MUST descartar as credenciais
  e os dados de moedas em memória.
- **FR-010**: Erros de moedas MUST ter mensagens específicas e acessíveis (saldo insuficiente, indisponibilidade, conflito),
  nunca uma mensagem genérica quando o motivo é conhecido.
- **FR-011**: A simulação usada em desenvolvimento e testes MUST se comportar como o serviço real nos pontos desta feature:
  chave de operação (efeito único, conflito, chave inválida), saldo insuficiente e isolamento por pessoa.
- **FR-012**: A versão publicada do site MUST chamar o serviço de moedas apenas pelo caminho `/backend` do próprio domínio;
  MUST NOT conter endereços de serviço local.
- **FR-013**: O cliente do serviço antigo de moedas (006) MUST ser removido do site, assim como a configuração que só ele
  usava; o serviço antigo em si MUST NOT ser alterado.
- **FR-014**: O contrato do serviço real MUST NOT mudar por causa desta feature (nenhuma operação nova; o estorno usa a
  recarga com chave).
- **FR-015**: As demais áreas do site (catálogo, carrinho, pedidos, carteiras de cripto, admin do site) MUST continuar
  funcionando como antes, com a simulação atual.
- **FR-016**: A limitação conhecida — a emissão da credencial de moedas confia no identificador da pessoa, e a identidade
  do site é simulada — MUST estar documentada para a equipe; as moedas do site publicado são de demonstração.

### Key Entities

- **Saldo de moedas**: quantidade inteira de moedas de uma pessoa, com o instante da última alteração.
- **Operação de moedas**: recarga, desconto ou devolução, com valor inteiro positivo, instante e chave de operação; aparece
  no histórico.
- **Chave de operação**: identificador escolhido pelo site para cada ação; a mesma chave nunca produz dois efeitos.
- **Pedido pago com moedas**: pedido do checkout cuja chave origina as chaves do desconto e da eventual devolução.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: No site publicado, 100% das tentativas de recarga bem-sucedidas aparecem no saldo e no histórico, inclusive
  após recarregar a página.
- **SC-002**: Em 20 repetições de uma mesma ação (clique duplo ou nova tentativa após falha de rede), o saldo muda
  exatamente uma vez, em 100% dos casos testados.
- **SC-003**: Em 100% dos pedidos que falham após o desconto, o saldo final é igual ao saldo antes do pedido, com
  exatamente uma devolução registrada.
- **SC-004**: Com saldo insuficiente, 0 pedidos são criados e 0 moedas são descontadas, e a mensagem mostra saldo e valor
  necessário.
- **SC-005**: Saldo e recarga aparecem para a pessoa em até 2 segundos em 95% das vezes no site publicado.
- **SC-006**: A suíte de testes do site roda sem nenhum serviço externo no ar, e os testes já existentes continuam com o
  mesmo resultado de antes desta feature (apenas as falhas conhecidas e já registradas).
- **SC-007**: A versão publicada do site tem 0 referências a endereços de serviço local e 0 chamadas ao serviço antigo.

## Assumptions

- **Identidade**: o "dono" do saldo é o identificador da pessoa logada na sessão simulada do site; a credencial de moedas
  é emitida para esse identificador. Não há login real de usuário final (limitação aceita, já documentada na 007/010).
- **Devolução por crédito**: o serviço real não tem estorno; a devolução é uma recarga com chave derivada do pedido,
  decisão do usuário para não mudar o serviço.
- **Conversão de preço**: continua a taxa e o arredondamento já usados pelo site (1 ETH = 1000 moedas, arredondando para
  cima).
- **Ambientes do serviço**: o serviço publicado precisa ter os ambientes de teste separados dos de produção (pendência da
  010) para que testes de preview nunca escrevam em dados de produção; esta feature não resolve isso.
- **Fora de escopo**: área administrativa do serviço de moedas (o admin do site trata de NFTs e usuários simulados),
  login real, notificação em tempo real de saldo, e qualquer mudança no serviço antigo (006).
