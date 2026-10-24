# Research — 009 Documentação Swagger/OpenAPI

Fase 0. Cada decisão resolve uma incógnita do Technical Context do `plan.md`. Formato: Decisão / Justificativa / Alternativas consideradas.

## D1 — Como gerar o OpenAPI a partir do Zod

**Decisão**: Usar o conversor **nativo do Zod v4, `z.toJSONSchema()`**, para produzir os schemas de componente, e montar o resto do documento (paths, security, responses, info, servers) com **código próprio tipado** contra os tipos de OpenAPI 3.1. Sem biblioteca de OpenAPI nova.

**Justificativa**:
- `apps/api` já depende de `zod@^4.6.5` (verificado em `package.json`). O Zod 4 traz `z.toJSONSchema` embutido; não precisa de nenhum pacote adicional.
- A constituição (v1.3.0) lista a stack permitida de `apps/api` de forma fechada; usar só Zod + Express mantém o Constitution Check em PASS sem emenda.
- OpenAPI 3.1 é um **superset de JSON Schema 2020-12**, então o JSON Schema que o Zod emite encaixa diretamente em `components.schemas` sem tradução.
- Fonte única: o mesmo objeto Zod valida na borda e gera a doc (FR-005), eliminando divergência (US3/SC-006).

**Alternativas consideradas**:
- `@asteasolutions/zod-to-openapi`: maduro, porém historicamente acoplado ao **Zod v3**; introduzir dep nova fora da stack + risco de incompatibilidade com Zod 4. Rejeitado.
- `zod-openapi` (samchungy): suporta Zod 4 e é ergonômico, mas ainda é uma dependência de runtime nova fora da lista da constituição, sem ganho essencial sobre o conversor nativo para apenas 6 rotas. Rejeitado (reavaliar só se o nativo se mostrar insuficiente — ver gatilho abaixo).
- **Gatilho de reavaliação**: se durante a implementação o `z.toJSONSchema` não cobrir algum schema em uso (ex.: um refinamento sem representação), a alternativa é adicionar metadados via `.meta()`/`override` (ainda nativo) antes de cogitar uma lib externa; só então isso viraria violação de constituição a justificar + emenda.

## D2 — Versão alvo do OpenAPI

**Decisão**: **OpenAPI 3.1.x**.

**Justificativa**: 3.1 alinha o dialeto de schema ao JSON Schema 2020-12, que é o que o `z.toJSONSchema` emite por padrão — menos atrito e nenhuma conversão de nuances (ex.: `examples`, `nullable` → `type: [..., "null"]`). Ferramentas atuais (Swagger UI recente, validadores) suportam 3.1.

**Alternativas**: 3.0.3 exigiria o modo de compatibilidade do conversor e a reescrita de construções 2020-12 (ex.: `nullable`), sem benefício aqui. Rejeitado.

## D3 — Entrada vs. saída nos schemas (coerce/default/transform)

**Decisão**: Gerar o JSON Schema no modo **entrada (`io: "input"`)** para request bodies e parâmetros, e no modo **saída (`io: "output"`)** para response models.

**Justificativa**: `transactionsQuerySchema` usa `z.coerce.number().int().min(1).max(200).optional().default(50)`. O cliente envia uma **string** opcional (`?limit=100`), mas após o parse é um número com default 50. Documentar o parâmetro `limit` pelo lado de saída enganaria o consumidor. Os response models (`coinBalanceRecordSchema`, `coinTransactionRecordSchema`) representam o que a API **retorna**, logo o lado de saída. O Zod 4 expõe essa escolha via a opção `io` do `toJSONSchema`.

**Alternativas**: um único modo para tudo — rejeitado por documentar formatos incorretos nos casos com `coerce`/`default`.

## D4 — Como servir a Swagger UI

**Decisão**: Servir em `GET /api/docs` um **HTML mínimo próprio** que carrega os assets da Swagger UI de um **CDN público** (ex.: `swagger-ui-dist` via unpkg/jsdelivr, versão pinada) e aponta para `GET /api/openapi.json`. Não bundlar a UI nem usar `swagger-ui-express`.

**Justificativa**:
- Zero dependência npm de runtime → mantém o Constitution Check em PASS.
- Function leve: não empacota os ~MBs de assets da Swagger UI; cold start menor.
- Evita problemas conhecidos de `swagger-ui-express` servindo assets estáticos sob a Function catch-all da Vercel (paths de assets relativos quebram atrás do rewrite `/api/*`).
- O documento continua servido pela própria Function (`/api/openapi.json`), que é a parte dinâmica/derivada do Zod.

**Alternativas**:
- `swagger-ui-express`: dependência nova + fricção com serving estático em serverless. Rejeitado.
- Bundlar `swagger-ui-dist` localmente: aumenta o tamanho da Function sem ganho (CDN público é aceitável para um demo). Rejeitado.
- Redoc via CDN: equivalente; Swagger UI é o pedido explícito ("documentação swagger") e tem o "Try it out" exigido na US1. Mantido Swagger UI.

## D5 — Quando montar o documento (custo/memoização) e serverless

**Decisão**: Montar o documento **uma vez por processo** (lazy, memoizado em módulo) e servir a cópia em memória; sem I/O de rede nem de Blob na geração.

**Justificativa**: a geração é pura (Zod → JSON Schema → objeto). Memoizar evita recomputar a cada request e torna o `/api/openapi.json` praticamente instantâneo após o primeiro acesso, dentro do alvo de < 50 ms. Em serverless, cada instância memoiza no seu próprio processo — aceitável e barato. Nada de persistência (não toca Vercel Blob).

**Alternativas**: gerar a cada request (desperdício) ou gerar em build e servir arquivo estático (reintroduz o problema de asset estático + perde a derivação viva em dev). Rejeitado.

## D6 — Centralização dos schemas inline (fonte única)

**Decisão**: Mover `tokenRequestSchema` para `src/domains/auth/contracts.ts` (novo) e `amountSchema` + `transactionsQuerySchema` para `src/domains/coins/contracts.ts` (já existe, ao lado dos record-schemas). As rotas passam a **importar** esses objetos; o montador de OpenAPI importa os **mesmos** objetos.

**Justificativa**: hoje esses schemas estão inline em `routes/auth.ts`/`routes/coins.ts`; se a doc os redefinisse, haveria duas fontes (divergência). Centralizar dá fonte única (FR-006) e respeita DDD (contratos vivem em `domains/<domínio>/contracts`). A validação em runtime **não muda** — é o mesmíssimo objeto Zod, só movido de arquivo.

**Alternativas**: um registry global de OpenAPI que referencia schemas sem movê-los — mais indireção; a centralização por domínio é mais simples e alinhada ao código existente. Rejeitado.

## D7 — Esquema de segurança

**Decisão**: `components.securitySchemes.bearerAuth = { type: "http", scheme: "bearer", bearerFormat: "JWT" }`. Aplicar `security: [{ bearerAuth: [] }]` **por operação** apenas em `/api/coins/*`. `health` e `auth/token` ficam sem `security` (públicas).

**Justificativa**: espelha o `requireAuth` real (`Authorization: Bearer <token>`, HS256 JWT) e o fato de `/coins/*` exigir token enquanto `health`/`auth/token` não (contrato da 007, FR-004). Aplicar por operação (em vez de global) evita marcar as públicas como protegidas.

**Alternativas**: `security` global + override vazio nas públicas — mais pegadinhas; por-operação é explícito. Rejeitado.

## D8 — `info`, `servers` e limitações visíveis

**Decisão**: `info.title` = "NFT Marketplace — apps/api", `info.version` = a versão do `apps/api/package.json`, e `info.description` contendo **em texto** as duas limitações conhecidas: (a) a emissão de `/api/auth/token` confia no `ownerId` pedido (não é login real); (b) o armazenamento em Vercel Blob usa concorrência otimista e **não garante ausência de atualizações perdidas** sob concorrência — explicando a semântica de `409`/retry (achado da 007, T037). `servers`: `http://localhost:3000/api` (`vercel dev`), `http://localhost:4001/api` (`dev:local`), `https://<deployment>.vercel.app/api` (produção), reutilizando os base paths do contrato da 007.

**Justificativa**: FR-009/FR-014 e a exigência da constituição de nunca esconder/limpar essas limitações.

**Alternativas**: omitir limitações (viola constituição) — rejeitado.

## D9 — Tipos não representáveis e ausência de segredos

**Decisão**: Datas (`z.string().datetime()`) saem como `{ type: "string", format: "date-time" }` (representação nativa do conversor). Configurar o conversor para **falhar** em algo verdadeiramente não representável (em vez de emitir vazio), para não produzir doc silenciosamente incompleta; em dev isso vira erro a corrigir, não `any`. O output é apenas o shape dos dados — **nenhum** valor de `AUTH_JWT_SECRET`/`BLOB_READ_WRITE_TOKEN` entra no documento; exemplos de token são claramente fictícios (ex.: `"eyJhbGciOi...«exemplo»"`).

**Justificativa**: FR-008/FR-012/SC-007. Preferir falha explícita a `any` casa com o Princípio II.

**Alternativas**: `unrepresentable: "any"` — produz `any`/`{}` na doc, mascara buracos. Rejeitado.

## D10 — Estratégia de verificação

**Decisão**: Estender `apps/api/scripts/smoke-test.mjs` com: (1) `GET /api/openapi.json` → `200`, `Content-Type: application/json`, `openapi` começa com `3.1`; (2) as 6 operações presentes em `paths` com os métodos certos; (3) `securitySchemes.bearerAuth` presente e referenciado só em `/coins/*`; (4) os componentes esperados presentes; (5) **validação do documento por um validador OpenAPI 3.1 independente** (executado no smoke/CI); (6) `GET /api/docs` → `200`, `text/html`. O smoke-test existente da 007 (auth/coins) roda como gate de regressão (SC-004). Playwright do front permanece **não** apontado para `apps/api` (constituição).

**Justificativa**: `apps/api` tem estratégia de verificação própria (convenção da 007); valida tanto a existência quanto a conformidade 3.1 (SC-001/SC-002).

**Alternativas**: validar só "a rota responde 200" — não prova conformidade 3.1. Rejeitado.
