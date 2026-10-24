import pkg from "../../package.json" with { type: "json" }
import {
  componentSchemas,
  idempotencyKeyHeaderSchema,
  limitParameterSchema,
  schemaRef,
  type JsonSchema,
} from "./components.js"

/** Minimal OpenAPI 3.1 document shape (only what we emit). */
export interface OpenApiDocument {
  openapi: string
  info: Record<string, unknown>
  servers: Record<string, unknown>[]
  tags: Record<string, unknown>[]
  paths: Record<string, Record<string, unknown>>
  components: {
    schemas: Record<string, JsonSchema>
    securitySchemes: Record<string, JsonSchema>
  }
}

const jsonContent = (schemaName: string): JsonSchema => ({
  content: { "application/json": { schema: schemaRef(schemaName) } },
})

const okResponse = (description: string, schemaName: string): JsonSchema => ({
  description,
  ...jsonContent(schemaName),
})

const errorResponse = (description: string): JsonSchema => ({
  description,
  ...jsonContent("Error"),
})

const jsonBody = (schemaName: string): JsonSchema => ({
  required: true,
  ...jsonContent(schemaName),
})

const idempotencyKeyParameter: JsonSchema = {
  name: "Idempotency-Key",
  in: "header",
  required: false,
  description:
    "Opcional. A mesma chave repetida com a mesma operação e o mesmo `amount` devolve o resultado original sem novo efeito; com outra operação ou outro `amount` retorna `409`.",
  schema: idempotencyKeyHeaderSchema,
}

// Applied only to /coins/* operations (research.md D7).
const secured: JsonSchema[] = [{ bearerAuth: [] }]

// Declared on every operation so an undeclared status (incl. the catch-all
// `404 route_not_found`) is still documented as the Error envelope.
const defaultError = errorResponse("Erro inesperado ou rota não encontrada (envelope de erro padrão).")

const INFO_DESCRIPTION = [
  "Backend `apps/api` do NFT Marketplace (feature 007), implantado como Vercel Serverless Functions.",
  "Esta documentação é **gerada a partir dos mesmos schemas Zod** que validam as requisições, então não pode divergir do comportamento real.",
  "",
  "**Limitações conhecidas (não escondidas):**",
  "",
  "1. **Emissão de token confia no `ownerId` pedido.** `POST /auth/token` emite um JWT para qualquer `ownerId` informado — não há login/senha real. É uma simplificação assumida do desafio, aceitável por não envolver dinheiro nem dados sensíveis reais. O *uso* subsequente é verificado (o `ownerId` vem só da claim do token), mas a *emissão* não autentica ninguém.",
  "2. **Persistência em Postgres (Neon).** Crédito e débito são uma única instrução SQL atômica (saldo + histórico juntos); débito sem saldo suficiente retorna `402` sem gravar nada. Não há `409` de concorrência.",
  "",
  "Exemplos de token são fictícios; nenhum segredo é exposto por esta API.",
].join("\n")

function assemble(): OpenApiDocument {
  return {
    openapi: "3.1.0",
    info: {
      title: "NFT Marketplace — apps/api",
      version: typeof pkg.version === "string" ? pkg.version : "0.0.0",
      description: INFO_DESCRIPTION,
    },
    servers: [
      { url: "http://localhost:3000/api", description: "vercel dev" },
      { url: "http://localhost:4001/api", description: "listener local (pnpm dev:local)" },
      { url: "https://<deployment>.vercel.app/api", description: "produção (substitua <deployment>)" },
    ],
    tags: [
      { name: "health", description: "Verificação de saúde da função e do banco." },
      { name: "auth", description: "Emissão de token (confia no ownerId — ver descrição da API)." },
      { name: "coins", description: "Saldo e histórico de moedas — exige Bearer token." },
    ],
    paths: {
      "/health": {
        get: {
          tags: ["health"],
          summary: "Verifica a função e a conexão com o banco.",
          operationId: "getHealth",
          responses: {
            "200": okResponse("Serviço saudável.", "HealthResponse"),
            "500": errorResponse("`DATABASE_URL` ausente (`missing_database_url`) ou banco inacessível (`database_unavailable`)."),
            default: defaultError,
          },
        },
      },
      "/auth/token": {
        post: {
          tags: ["auth"],
          summary: "Emite um JWT de 15 min para o ownerId informado (não autentica).",
          operationId: "issueToken",
          requestBody: jsonBody("TokenRequest"),
          responses: {
            "200": okResponse("Token emitido.", "TokenResponse"),
            "400": errorResponse("`ownerId` ausente ou vazio (`invalid_owner_id`)."),
            "500": errorResponse("`AUTH_JWT_SECRET` ausente (`missing_auth_secret`)."),
            default: defaultError,
          },
        },
      },
      "/coins/balance": {
        get: {
          tags: ["coins"],
          summary: "Saldo do owner identificado pelo token.",
          operationId: "getBalance",
          security: secured,
          responses: {
            "200": okResponse("Saldo atual (owner novo → amount 0, version 0).", "CoinBalanceRecord"),
            "401": errorResponse("Token ausente, expirado ou inválido."),
            default: defaultError,
          },
        },
      },
      "/coins/topup": {
        post: {
          tags: ["coins"],
          summary: "Credita o saldo do owner do token.",
          operationId: "topUp",
          security: secured,
          parameters: [idempotencyKeyParameter],
          requestBody: jsonBody("AmountRequest"),
          responses: {
            "200": okResponse("Saldo atualizado após o crédito.", "CoinBalanceRecord"),
            "400": errorResponse("Body inválido (`invalid_amount`) ou `Idempotency-Key` inválida (`invalid_idempotency_key`)."),
            "401": errorResponse("Token ausente, expirado ou inválido."),
            "409": errorResponse("`Idempotency-Key` já usada com outra operação ou outro valor (`idempotency_key_conflict`)."),
            "500": errorResponse("Falha no banco; nada foi aplicado (a instrução é atômica)."),
            default: defaultError,
          },
        },
      },
      "/coins/debit": {
        post: {
          tags: ["coins"],
          summary: "Debita o saldo do owner do token.",
          operationId: "debit",
          security: secured,
          parameters: [idempotencyKeyParameter],
          requestBody: jsonBody("AmountRequest"),
          responses: {
            "200": okResponse("Saldo atualizado após o débito.", "CoinBalanceRecord"),
            "400": errorResponse("Body inválido (`invalid_amount`) ou `Idempotency-Key` inválida (`invalid_idempotency_key`)."),
            "401": errorResponse("Token ausente, expirado ou inválido."),
            "402": errorResponse("Saldo insuficiente (`insufficient_balance`) — nada é escrito."),
            "409": errorResponse("`Idempotency-Key` já usada com outra operação ou outro valor (`idempotency_key_conflict`)."),
            "500": errorResponse("Falha no banco; nada foi aplicado (a instrução é atômica)."),
            default: defaultError,
          },
        },
      },
      "/coins/transactions": {
        get: {
          tags: ["coins"],
          summary: "Histórico de transações do owner do token (mais recente primeiro).",
          operationId: "listTransactions",
          security: secured,
          parameters: [
            {
              name: "limit",
              in: "query",
              required: false,
              description: "Inteiro entre 1 e 200 (default 50).",
              schema: limitParameterSchema,
            },
          ],
          responses: {
            "200": okResponse("Lista de transações.", "TransactionsResponse"),
            "400": errorResponse("`limit` inválido (`invalid_limit`)."),
            "401": errorResponse("Token ausente, expirado ou inválido."),
            default: defaultError,
          },
        },
      },
    },
    components: {
      schemas: componentSchemas,
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  }
}

// Memoized per process: the document is pure (Zod → JSON Schema → object), so we
// build it once and serve the same instance (research.md D5).
let cached: OpenApiDocument | null = null

export function buildOpenApiDocument(): OpenApiDocument {
  if (cached === null) {
    cached = assemble()
  }
  return cached
}
