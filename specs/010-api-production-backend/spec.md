# Feature Specification: Back-end de produção (`apps/api`) funcionando de verdade

**Feature Branch**: `010-api-production-backend`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "colocar o back-end apps/api para funcionar em produção na Vercel: (1) corrigir o deploy de produção; (2) corrigir a perda de atualizações no saldo de moedas sob concorrência, usando armazenamento com operações atômicas; (3) tirar os usuários admin e dados sensíveis do armazenamento público; o front-end já está publicado com rewrite `/backend/*` para a API."

Fatos verificados no repositório e nos deploys (não supostos):

1. **A API de produção responde `404` em todas as rotas `/api/*`** (`nft-marketplace-api-ochre.vercel.app`, `/api/health` = `404` da plataforma). O projeto foi criado com o preset de framework errado; a correção (`framework: null`, `buildCommand: ""`) existe em `apps/api/vercel.json`, mas nunca foi implantada em produção. A 007 só verificou um preview.
2. **O front-end publicado chega à API pelo rewrite `/backend/*`**; hoje `GET /backend/health` no site público também devolve `404`, porque o destino está quebrado.
3. **O saldo de moedas perde atualizações sob concorrência.** Medido em 2026-10-23 contra um deploy real: 12 créditos de +1 simultâneos → 10 aceitos, 2 recusados, saldo final **4** (deveria ser 10). O armazenamento atual não oferece escrita condicional atômica, e leituras logo após a escrita podem devolver versão antiga. O critério SC-003 da 007 (50 operações concorrentes, zero atualização perdida) **falha**. O histórico de transações permanece íntegro, então saldo e histórico podem divergir.
4. **Registros de administradores ficam em armazenamento acessível por URL pública**: o hash da senha de cada admin é um objeto legível por qualquer pessoa que conheça o endereço. É um hash salgado (nunca senha em claro), mas não é armazenamento privado.
5. **A constituição (v1.4.0, exceção `apps/api`) hoje proíbe um banco relacional e fixa o Vercel Blob como armazenamento**; mudar o armazenamento exige uma emenda explícita (ver Assumptions).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A API publicada responde em produção (Priority: P1)

Quem usa o site publicado (e qualquer cliente que chame a API) obtém respostas reais da API: saúde, emissão de token, login de admin e rotas de moedas, tanto direto no domínio da API quanto pelo caminho `/backend/*` do site.

**Why this priority**: Sem a API respondendo, as outras duas histórias não têm onde ser provadas e o site publicado continua com o back-end quebrado. É a menor fatia que entrega valor: "a API existe em produção".

**Independent Test**: Chamar `GET /api/health` no domínio de produção da API e `GET /backend/health` no domínio do site; ambos devolvem a resposta real da API.

**Acceptance Scenarios**:

1. **Given** a API em produção, **When** se faz `GET /api/health`, **Then** a resposta é `200` com o corpo de saúde da API (não um `404` da plataforma).
2. **Given** o site publicado, **When** o navegador chama `/backend/health`, **Then** a requisição chega à API real e devolve o mesmo resultado, sem erro de origem cruzada.
3. **Given** uma rota inexistente (`/api/qualquer-coisa`), **When** chamada em produção, **Then** a resposta é o `404` estruturado da própria API (distinguível do `404` da plataforma).
4. **Given** uma variável obrigatória ausente em produção, **When** a API é chamada, **Then** falha com erro claro e específico, nunca com sucesso silencioso nem emitindo/aceitando token não verificável.
5. **Given** um deploy de preview, **When** se verifica a API, **Then** o comportamento é o mesmo do de produção (paridade), e a promoção para produção é um passo explícito e verificável.

---

### User Story 2 - O saldo de moedas nunca perde uma atualização (Priority: P2)

Um dono de saldo faz várias operações ao mesmo tempo (créditos, débitos, de várias abas ou dispositivos). O saldo final reflete exatamente todas as operações aceitas; as recusadas são devolvidas de forma explícita e nada é aceito "em silêncio" e depois perdido.

**Why this priority**: É o defeito de correção do produto (dinheiro de moedas errado). Depende de US1 para ser provado em produção, mas a correção em si é independente do deploy.

**Independent Test**: Disparar 50 operações simultâneas contra o mesmo saldo e comparar o saldo final com a soma das operações aceitas.

**Acceptance Scenarios**:

1. **Given** um saldo conhecido, **When** 50 créditos simultâneos são enviados, **Then** o saldo final é igual ao saldo inicial mais a soma dos créditos aceitos, e toda operação recusada recebeu uma resposta de conflito/erro explícita.
2. **Given** créditos e débitos simultâneos, **When** a soma dos débitos excede o saldo, **Then** nenhum débito que deixaria o saldo negativo é aceito, e o saldo final nunca é negativo.
3. **Given** qualquer sequência de operações, **When** se compara o saldo com o histórico de transações aceitas, **Then** os dois sempre concordam (saldo = soma do histórico).
4. **Given** uma falha parcial (a operação falha no meio), **When** o dono consulta, **Then** o saldo e o histórico continuam consistentes entre si (a operação aparece nos dois ou em nenhum).
5. **Given** dois donos diferentes operando ao mesmo tempo, **When** cada um opera no seu saldo, **Then** nenhum interfere no outro (isolamento por dono preservado).

---

### User Story 3 - Dados sensíveis deixam de ser publicamente legíveis (Priority: P3)

Credenciais e registros de administradores (e qualquer dado que não deva ser público) só são acessíveis pela própria API, nunca por uma URL que qualquer pessoa possa abrir.

**Why this priority**: Corrige uma exposição real e é pré-requisito de chamar o ambiente de "produção real", mas não bloqueia US1/US2.

**Independent Test**: Tentar ler, sem credenciais, qualquer registro de admin ou de saldo por endereço direto de armazenamento; deve ser impossível, enquanto o login de admin continua funcionando pela API.

**Acceptance Scenarios**:

1. **Given** um administrador cadastrado, **When** alguém tenta obter o registro dele (hash incluído) sem passar pela API, **Then** não consegue — nenhum endereço público devolve esse registro.
2. **Given** o login de admin, **When** e-mail e senha corretos são enviados, **Then** o login continua funcionando e emite o token de admin como antes; e-mail desconhecido e senha errada continuam indistinguíveis.
3. **Given** os dados de saldo e transações dos donos, **When** se tenta lê-los sem um token válido do dono, **Then** o acesso é negado (a API é o único caminho).
4. **Given** o ambiente de produção, **When** se inspeciona o repositório e os logs, **Then** não há senha em claro, segredo ou token em arquivo versionado nem em log.

---

### User Story 4 - Operar e verificar a produção é repetível (Priority: P4)

Qualquer pessoa da equipe consegue implantar a API, conferir que está saudável e saber o que fazer se algo falhar, seguindo um procedimento documentado com a matriz de variáveis por ambiente.

**Why this priority**: Consolida US1–US3 para não depender de conhecimento tácito, mas só faz sentido depois deles.

**Independent Test**: Seguindo só o guia, uma pessoa nova implanta um preview, roda a verificação automatizada e promove para produção.

**Acceptance Scenarios**:

1. **Given** o repositório, **When** alguém segue o guia de implantação, **Then** obtém a API em produção e a verificação automatizada passa de ponta a ponta (saúde → token → crédito → débito → saldo → histórico → login de admin).
2. **Given** a verificação automatizada, **When** roda contra o domínio de produção, **Then** ela cobre também a concorrência (US2) e a negação de leitura pública (US3), e falha com mensagem clara se algo regredir.
3. **Given** um deploy ruim, **When** a verificação falha, **Then** o guia descreve como voltar à versão anterior sem perda de dados.

---

### Edge Cases

- **Rajada de requisições do mesmo IP** (teste de concorrência): a proteção anti-bot da plataforma pode recusar parte delas com pedido de espera; a verificação de concorrência MUST distinguir "recusada pela plataforma" de "aceita e perdida" (só a segunda é falha de consistência).
- **Primeira requisição após inatividade** (partida a frio): MUST responder dentro do orçamento definido em SC-006, sem erro.
- **Armazenamento indisponível**: MUST falhar de forma visível (erro de servidor claro), nunca devolver saldo zerado, sucesso falso ou dados de outro dono.
- **Dados antigos no armazenamento anterior** (saldos e admins de demonstração): têm de ter um destino definido (descartar e recriar ou migrar) — ver Assumptions.
- **Preview protegido pela plataforma vs. produção pública**: a verificação de preview precisa de acesso autenticado; a de produção, não.
- **Destino do rewrite do front-end é fixo**: se o domínio da API mudar, o `vercel.json` do site precisa ser editado e republicado — documentado, não automático.
- **Segredo de assinatura trocado**: tokens antigos passam a ser recusados (`401`); o front-end MUST reemitir e seguir.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A API MUST estar implantada em produção, e toda rota documentada em `contracts/` da 007 (`/api/health`, `/api/auth/token`, `/api/coins/*`, `/api/admin/*`) MUST responder em produção com os mesmos códigos de status e formato de resposta que no ambiente local equivalente.
- **FR-002**: O projeto da API MUST ter a configuração de implantação correta versionada no repositório, e a promoção de preview para produção MUST ser um passo explícito, seguido de verificação do endereço público de produção.
- **FR-003**: `GET /backend/health` no domínio público do site MUST ser atendido pela API real (cadeia ponta a ponta site → API), e a US2 da 008 (ligação real) MUST passar a poder ser concluída.
- **FR-004**: O saldo de cada dono MUST ser atualizado por operações atômicas: nenhuma operação aceita pode ser perdida por outra concorrente, e nenhuma operação pode ser aceita sem refletir no saldo **e** no histórico.
- **FR-005**: Um débito que deixaria o saldo negativo MUST ser recusado (`402`), mesmo sob concorrência; o saldo MUST NOT ficar negativo em nenhuma sequência de operações.
- **FR-006**: Conflitos de concorrência MUST ser resolvidos dentro da API quando possível (nova tentativa interna) e, quando não, MUST devolver uma resposta explícita que o cliente possa repetir com segurança — nunca aceitar em silêncio.
- **FR-007**: Operações MUST ser idempotentes quando o cliente envia uma chave de operação: repetir a mesma operação (por exemplo após timeout) MUST NOT creditar ou debitar duas vezes.
- **FR-008**: Registros de administradores, hashes de senha, saldos e histórico MUST residir em armazenamento **sem acesso público por endereço**; o único caminho de leitura/escrita MUST ser a API, autenticada conforme a rota.
- **FR-009**: O login de admin, os tokens de admin e de dono e o isolamento entre donos (007 FR-012 a FR-016, SC-006, SC-007) MUST continuar exatamente como estão; esta feature MUST NOT enfraquecer nenhuma garantia de segurança existente.
- **FR-010**: Senhas MUST permanecer apenas como hash salgado; segredos e credenciais de produção MUST vir só de variáveis de ambiente do projeto, nunca de arquivo versionado nem de log. O cadastro inicial do admin de produção MUST ser feito por script que lê credenciais do ambiente.
- **FR-011**: A API MUST falhar na partida/primeira chamada, com erro específico, se faltar qualquer variável obrigatória em produção (acesso ao armazenamento, segredo de assinatura).
- **FR-012**: MUST existir uma verificação automatizada executável contra um endereço de API (local, preview ou produção) que cubra: saúde, `404` estruturado, negação sem token, emissão de token, crédito/débito/saldo/histórico, isolamento entre donos, login de admin, concorrência de 50 operações e negação de leitura pública de dados sensíveis.
- **FR-013**: A matriz de variáveis de ambiente (desenvolvimento, preview, produção), o procedimento de implantação, a verificação pós-implantação e o procedimento de volta à versão anterior MUST estar documentados.
- **FR-014**: Os dados de demonstração do armazenamento anterior MUST ter destino definido e documentado (ver Assumptions), e a mudança de armazenamento MUST NOT exigir alteração no contrato HTTP consumido pelo `apps/web`.
- **FR-015**: Esta feature MUST NOT alterar `server/` (moedas da 006) nem o comportamento do `apps/web`, exceto, se necessário, configuração de ambiente/rewrite do site.

### Key Entities

- **Dono (owner)**: identidade que possui um saldo; isolada das demais. Atributos: identificador, saldo atual, versão/estado da última operação aceita.
- **Transação de moedas**: registro imutável de uma operação aceita (crédito/débito): dono, valor, tipo, instante, chave de idempotência. A soma do histórico de um dono é igual ao seu saldo.
- **Administrador**: conta com e-mail e hash salgado da senha; nunca legível fora da API.
- **Ambiente**: desenvolvimento, preview ou produção, cada um com seu conjunto de variáveis e seu armazenamento.
- **Verificação de implantação**: o conjunto de checagens executáveis (FR-012) que prova que um ambiente está saudável.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das rotas documentadas respondem em produção com os status esperados; `GET /api/health` em produção e `GET /backend/health` no site público devolvem `200` da API real.
- **SC-002**: Em 50 operações simultâneas no mesmo saldo (créditos e débitos), o saldo final é exatamente igual ao saldo inicial mais a soma das operações aceitas, em 10 de 10 execuções consecutivas — **zero** atualizações perdidas (corrige o 12→4 medido).
- **SC-003**: Em qualquer momento, para 100% dos donos testados, o saldo é igual à soma do histórico de transações aceitas.
- **SC-004**: 0 registros de administrador, hash de senha, saldo ou histórico podem ser obtidos sem passar pela API, em todas as tentativas de leitura direta feitas pela verificação automatizada.
- **SC-005**: Repetir a mesma operação idempotente N vezes produz exatamente 1 efeito no saldo, em 100% dos casos testados.
- **SC-006**: 95% das requisições comuns da API (saúde, saldo, operação simples) respondem em até 2 segundos em produção, incluindo a primeira após inatividade em pelo menos 90% das vezes.
- **SC-007**: Uma pessoa que nunca implantou o projeto consegue, seguindo só o guia, ter a API verificada em produção sem ajuda; a verificação automatizada completa termina em menos de 5 minutos.
- **SC-008**: As suítes existentes (e2e do `apps/web`, verificação do `server/`) continuam com o mesmo resultado de antes desta feature.

## Assumptions

- **Os dados atuais de saldo e admins no armazenamento anterior são de demonstração e podem ser descartados**: produção começa limpa, com o admin inicial recriado pelo script de cadastro; nada é migrado. Se alguém precisar preservar algum saldo, isso deve ser dito antes do plano.
- **Armazenamento com operações atômicas e acesso privado é um requisito; a escolha do produto fica para o plano.** Hoje a constituição (v1.4.0) fixa o Vercel Blob e proíbe banco relacional em `apps/api`; atender FR-004 e FR-008 exige trocar o armazenamento e, portanto, uma **emenda constitucional explícita** (v1.5.0) proposta pelo plano como pré-requisito — não uma extensão silenciosa.
- **A emissão de token de dono continua confiando no identificador pedido** (sem login real de usuário final), como na 007; essa limitação segue documentada e fora do escopo. A autenticação de admin real permanece como está.
- **Rotas `/admin/*` seguem somente leitura**; escrita/ajuste de saldo por admin continua fora de escopo.
- **Domínio `*.vercel.app` basta**: domínio próprio, monitoramento contínuo e alertas estão fora do escopo.
- **Implantação por CLI**: integração Git/CI com deploy automático não está no escopo (o repositório não tem CI).
- **O contrato HTTP não muda**: caminhos, métodos, status e formatos de resposta consumidos pelo `apps/web` permanecem; só a camada de armazenamento e a implantação mudam.
- **O destino fixo do rewrite do site** (`vercel.json` do `apps/web`) continua sendo a URL pública de produção da API.
