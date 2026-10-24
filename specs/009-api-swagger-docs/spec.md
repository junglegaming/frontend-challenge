# Feature Specification: Documentação Swagger/OpenAPI do backend `apps/api`

**Feature Branch**: `009-api-swagger-docs`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "documentação swagger" — expor uma documentação interativa (Swagger UI) e um documento OpenAPI legível por máquina para o backend `apps/api` (feature 007), gerados a partir dos schemas Zod que já validam as requisições, de forma que a documentação não possa divergir do comportamento real.

Fatos do código que moldam esta spec (verificados, não supostos):

1. **`apps/api` é um app Express 5** (`apps/api/src/app.ts`) montado atrás de uma única Vercel Function catch-all (`apps/api/api/index.ts`); o `vercel.json` reescreve `/api/(.*)` → `/api/index` preservando o path, então o Express monta todos os routers sob `/api`. O contrato autoritativo já existe em `specs/007-monorepo-vercel-blob/contracts/api-routes.md`.
2. **Há exatamente 6 rotas hoje**: `GET /api/health`, `POST /api/auth/token`, `GET /api/coins/balance`, `POST /api/coins/topup`, `POST /api/coins/debit`, `GET /api/coins/transactions`. As de `/api/coins/*` exigem `Authorization: Bearer <token>`; `health` e `auth/token` são públicas.
3. **Todas as entradas já são validadas por Zod v4** (`apps/api` depende de `zod@^4.6.5`): `tokenRequestSchema` (`routes/auth.ts`), `amountSchema` e `transactionsQuerySchema` (`routes/coins.ts`), e os registros `coinBalanceRecordSchema` / `coinTransactionRecordSchema` (`domains/coins/contracts.ts`). Parte desses schemas está **inline dentro dos arquivos de rota**, não centralizada.
4. **O envelope de erro é único e estável**: `{ "error": { "code": "string", "message": "string" } }` (`lib/errors.ts`), com os status `400/401/402/404/409/500` já mapeados por helpers.
5. **Não há nenhuma dependência de OpenAPI/Swagger instalada** em `apps/api` hoje.
6. **A constituição (v1.3.0) restringe a stack de `apps/api`** a Node.js, TypeScript, Express, `cors`, `zod`, `@vercel/blob` e `jsonwebtoken`. Introduzir um framework de documentação pesado estaria fora dessa lista; Zod v4 já sabe emitir JSON Schema nativamente (`z.toJSONSchema`), e OpenAPI 3.1 é um superset de JSON Schema.
7. **Duas limitações já documentadas da 007 precisam aparecer na doc, não ser escondidas**: (a) a emissão de token confia no `ownerId` pedido (não é login real); (b) o armazenamento em Vercel Blob usa concorrência otimista e **não garante ausência de atualizações perdidas** sob concorrência (achado confirmado da 007, T037) — o `409` faz parte do contrato e a doc deve explicar a semântica de retry.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consumidor explora a API numa UI interativa (Priority: P1) 🎯 MVP

Uma pessoa desenvolvedora (do time do front, ou avaliando o desafio) abre uma URL do backend e vê uma página Swagger UI listando todas as rotas, agrupadas, com os modelos de request/response, os códigos de erro possíveis e o esquema de autenticação. Consegue autorizar com um Bearer token e usar o "Try it out" contra uma instância em execução.

**Why this priority**: É a entrega de valor central ("documentação swagger") e a menor fatia utilizável — uma página navegável já torna a API auto-explicativa. Tudo o mais (spec para máquina, anti-divergência) reforça isto.

**Independent Test**: Subir `apps/api` localmente, abrir `GET /api/docs` no navegador, confirmar que as 6 rotas aparecem com seus corpos/parametros/respostas, que o cadeado de autorização existe, e que um "Try it out" em `GET /api/health` responde `200 {"status":"ok"}`.

**Acceptance Scenarios**:

1. **Given** `apps/api` em execução, **When** abro `GET /api/docs`, **Then** vejo uma Swagger UI com título/descrição da API e as 6 operações listadas e agrupadas por tag (`health`, `auth`, `coins`).
2. **Given** a Swagger UI aberta, **When** inspeciono `POST /api/coins/topup`, **Then** vejo o corpo `{ amount }` (inteiro positivo), o cadeado indicando que exige Bearer, e as respostas `200/400/401/409/500` com o envelope de erro.
3. **Given** a Swagger UI, **When** clico em "Authorize" e colo um token válido, **Then** as chamadas "Try it out" para `/api/coins/*` passam a enviar o header `Authorization: Bearer ...`.
4. **Given** a página de docs, **When** ela é aberta, **Then** ela **não** exige autenticação para ser vista (é pública, como `health`), e sua abertura não altera nenhum comportamento das rotas existentes.

---

### User Story 2 - Documento OpenAPI legível por máquina (Priority: P2)

A mesma documentação está disponível como um documento OpenAPI 3.1 válido, servido num endpoint, que pode ser validado, versionado, importado no Postman/Insomnia ou usado para geração de clientes.

**Why this priority**: Depois da UI humana, a utilidade seguinte é a interoperabilidade por máquina. A UI (US1) consome exatamente este documento, então ele sustenta a US1, mas o valor de importar/validar é incremental e separável.

**Independent Test**: Buscar `GET /api/openapi.json`, validar o corpo contra o schema OpenAPI 3.1 com um validador independente, e confirmar que as 6 rotas, o `securityScheme` bearer e os componentes de schema estão presentes.

**Acceptance Scenarios**:

1. **Given** `apps/api` em execução, **When** busco `GET /api/openapi.json`, **Then** recebo `200` com `Content-Type: application/json` e `openapi: "3.1.x"`.
2. **Given** o documento retornado, **When** o valido com uma ferramenta OpenAPI independente, **Then** ele passa sem erros de schema.
3. **Given** o documento, **When** inspeciono `components.securitySchemes`, **Then** existe um esquema HTTP `bearer` (JWT) e as operações de `/coins/*` o referenciam em `security`, enquanto `health` e `auth/token` não.
4. **Given** o documento, **When** inspeciono `components.schemas`, **Then** encontro os modelos `CoinBalanceRecord`, `CoinTransactionRecord`, o corpo de top-up/debit, o corpo de emissão de token e o envelope `Error`.

---

### User Story 3 - A documentação não pode divergir da validação (Priority: P3)

Os schemas exibidos na documentação são derivados dos **mesmos** objetos Zod que validam as requisições em tempo de execução, de modo que alterar uma regra de validação altera a documentação automaticamente, sem edição manual paralela.

**Why this priority**: É a garantia de qualidade que diferencia esta doc de um `openapi.yaml` escrito à mão. Importante, mas só observável sobre as US1/US2 já existentes.

**Independent Test**: Alterar temporariamente uma regra de um schema Zod (ex.: `amount` mínimo), rebuildar/rebuscar `openapi.json` e confirmar que a mudança aparece no documento sem nenhuma edição manual de doc; reverter.

**Acceptance Scenarios**:

1. **Given** o documento OpenAPI é gerado a partir dos schemas Zod, **When** uma regra de um schema Zod muda, **Then** o `openapi.json` reflete a mudança na próxima geração, sem edição manual.
2. **Given** schemas que hoje estão inline nas rotas, **When** esta feature termina, **Then** cada schema de request tem uma única definição, importada tanto pela rota (validação) quanto pela geração de doc (sem cópia duplicada).
3. **Given** schemas com `coerce`/`default` (ex.: `limit`), **When** gerados para doc, **Then** o lado de **entrada** (o que o cliente envia) é o representado no request, não o lado já parseado.

---

### Edge Cases

- **Divergência entrada × saída**: `transactionsQuerySchema` usa `z.coerce.number().default(50)`. O que o cliente envia (string opcional) difere do valor após o parse (número). A doc do parâmetro `limit` MUST representar o lado de entrada.
- **Tipos não representáveis**: datas (`z.string().datetime()`) e afins MUST ser emitidos de forma válida em JSON Schema (string com `format`), nunca quebrar a geração.
- **A rota de docs não pode colidir com o catch-all 404 nem com o error middleware** existentes (`app.ts`); deve ser montada antes do catch-all.
- **Produção Vercel**: a doc MUST funcionar servida pela Function (rewrite `/api/*`), sem assumir um filesystem estático local. Assets da Swagger UI vêm de CDN; o documento é servido pela própria Function.
- **Limitações conhecidas visíveis**: a descrição da API MUST citar explicitamente (a) emissão de token confia no `ownerId` e (b) a ausência de garantia transacional/possíveis atualizações perdidas no Blob, nunca apresentando a API como mais segura/consistente do que é.
- **Sem segredos na doc**: o `openapi.json` e a UI MUST NOT expor valores de `AUTH_JWT_SECRET`, `BLOB_READ_WRITE_TOKEN` nem exemplos de tokens reais.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST servir uma UI de documentação interativa (Swagger UI) numa rota pública sob `/api` (sem exigir token), listando todas as operações atuais de `apps/api`.
- **FR-002**: O sistema MUST servir um documento OpenAPI **3.1** legível por máquina numa rota pública sob `/api`, com `Content-Type: application/json`.
- **FR-003**: O documento MUST descrever as 6 operações existentes com método, path sob `/api`, parâmetros, corpo de request, respostas de sucesso e todos os códigos de erro já definidos no contrato da 007 (`400/401/402/409/500`, além do `404` do catch-all e do envelope de erro).
- **FR-004**: O documento MUST declarar um `securityScheme` HTTP `bearer` (formato JWT) e aplicá-lo exatamente às rotas `/api/coins/*`; `health` e `auth/token` MUST permanecer sem `security`.
- **FR-005**: Os schemas de componentes (request bodies e response models) MUST ser **gerados a partir dos schemas Zod existentes**, não escritos à mão em paralelo (fonte única).
- **FR-006**: Cada schema de request hoje inline numa rota MUST ser centralizado numa definição única, importada tanto pela validação em runtime quanto pela geração de doc, sem alterar a validação atual.
- **FR-007**: Para schemas com `coerce`/transform/`default`, a geração MUST usar a representação de **entrada** para requests (e a de saída para responses) para não documentar um formato que o cliente não envia.
- **FR-008**: A geração MUST produzir JSON Schema válido para todos os tipos em uso (incluindo datas ISO como string com `format`), sem falhar nem emitir `any`.
- **FR-009**: A documentação MUST descrever, em texto visível, as duas limitações conhecidas herdadas da 007 (emissão de token confia no `ownerId`; Blob sem garantia transacional, possíveis atualizações perdidas, semântica de `409`/retry).
- **FR-010**: A feature MUST NOT alterar o comportamento, o path, os status ou os corpos de nenhuma das 6 rotas existentes (apenas adiciona rotas de documentação) — regressão zero no contrato da 007.
- **FR-011**: A documentação MUST funcionar de forma idêntica em `vercel dev`, no listener local (`dev:local`) e no deploy de produção na Vercel (mesmo path sob `/api`).
- **FR-012**: A documentação e o documento MUST NOT expor segredos nem tokens reais; exemplos MUST ser claramente fictícios.
- **FR-013**: A solução MUST permanecer dentro da stack permitida para `apps/api` pela constituição (sem dependência de runtime nova fora da lista) ou, se uma dependência for inevitável, o plano MUST justificá-la na seção de complexidade e apontar a emenda necessária.
- **FR-014**: O `info` do documento (título, descrição, versão) e os `servers` MUST refletir os ambientes reais (local `:3000`/`:4001`, produção Vercel), reutilizando os base paths já descritos no contrato da 007.

### Key Entities *(include if feature involves data)*

- **Documento OpenAPI**: a descrição 3.1 completa da API — `info`, `servers`, `tags`, `paths` (uma entrada por operação), `components.schemas`, `components.securitySchemes`. É derivado, não persistido (gerado a cada chamada ou no boot).
- **Schema de Componente**: a projeção em JSON Schema de um schema Zod existente (ex.: `CoinBalanceRecord`, `CoinTransactionRecord`, corpo de `amount`, corpo de `ownerId`, envelope `Error`). Relaciona-se 1:1 com o schema Zod de origem.
- **Esquema de Segurança**: a declaração do Bearer/JWT e a associação dele às operações protegidas.
- **Operação**: a união de {método, path, tags, parâmetros, request, respostas, security} de cada uma das 6 rotas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das rotas atuais (6/6) aparecem na Swagger UI e no `openapi.json`, cada uma com request, resposta de sucesso e pelo menos um código de erro.
- **SC-002**: `GET /api/openapi.json` passa num validador OpenAPI 3.1 independente sem erros.
- **SC-003**: Em uma instância em execução, um "Try it out" autenticado em `/api/coins/balance` (após "Authorize") e um não autenticado em `/api/health` retornam as respostas esperadas (`200`), e um `/api/coins/balance` sem token retorna `401`.
- **SC-004**: As 6 rotas existentes mantêm comportamento idêntico ao anterior à feature (smoke-test da 007 continua verde; nenhum path/status/corpo mudou).
- **SC-005**: A documentação é acessível e idêntica em `vercel dev`, `dev:local` e no deploy de produção (mesmo path `/api/docs` e `/api/openapi.json`).
- **SC-006**: Zero divergência: alterar uma regra de um schema Zod altera o `openapi.json` sem nenhuma edição manual de documentação (demonstrável pelo teste independente da US3).
- **SC-007**: Nenhum segredo (`AUTH_JWT_SECRET`, `BLOB_READ_WRITE_TOKEN`) nem token real aparece no `openapi.json` ou na UI.

## Assumptions

- A documentação é **pública** (sem token), coerente com o fato de o produto não ter login real e a API ser um demo do desafio; isto é uma decisão assumida e fica registrada.
- O público-alvo são pessoas desenvolvedoras (time do front e avaliadores), não usuários finais da vitrine.
- O contrato autoritativo continua sendo `specs/007-.../contracts/api-routes.md`; esta feature **documenta** esse contrato, não o redefine.
- A feature é **somente backend** (`apps/api`); não há mudança em `apps/web`, `server/`, nem nos Princípios I–VII aplicados à SPA.
- Zod v4 (`z.toJSONSchema`) é suficiente para emitir os schemas em uso; nenhum banco, nenhuma persistência nova é introduzida.
- Os assets da Swagger UI podem ser carregados de um CDN público confiável (sem bundlar a UI inteira na Function), mantendo a Function leve e evitando problemas conhecidos de servir assets estáticos em serverless.
