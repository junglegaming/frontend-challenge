import { z } from "zod"
import { tokenRequestSchema } from "../domains/auth/contracts.js"
import {
  amountSchema,
  coinBalanceRecordSchema,
  coinTransactionRecordSchema,
  idempotencyKeySchema,
  transactionsQuerySchema,
} from "../domains/coins/contracts.js"

/** A JSON Schema fragment used inside the OpenAPI document. */
export type JsonSchema = Record<string, unknown>

/**
 * Project a Zod schema to an OpenAPI-ready JSON Schema fragment.
 *
 * Zod v4 emits JSON Schema 2020-12, which OpenAPI 3.1 consumes directly. We:
 * - pick `io: "input"` for request shapes (so coerced/defaulted fields such as
 *   `limit` are shown as the client sends them) and `io: "output"` for response
 *   shapes (research.md D3);
 * - drop the top-level `$schema` key, which does not belong on an OpenAPI
 *   component schema;
 * - leave `unrepresentable` at its default (throw) so a type we cannot document
 *   fails loudly instead of silently degrading to `any` (research.md D9).
 */
function toJsonSchema(schema: z.ZodType, io: "input" | "output"): JsonSchema {
  const full: JsonSchema = { ...z.toJSONSchema(schema, { io }) }
  delete full["$schema"]
  return full
}

const ref = (name: string): JsonSchema => ({ $ref: `#/components/schemas/${name}` })

// --- Schemas derived from the SAME Zod objects the routes validate with -------
// (single source — US3/FR-005/FR-006). Requests use input mode, responses output.
const TokenRequest = toJsonSchema(tokenRequestSchema, "input")
const AmountRequest = toJsonSchema(amountSchema, "input")
const CoinBalanceRecord = toJsonSchema(coinBalanceRecordSchema, "output")
const CoinTransactionRecord = toJsonSchema(coinTransactionRecordSchema, "output")

// --- Response envelopes assembled by hand (no Zod source today) ---------------
// They reference the Zod-derived records above by $ref so the record shapes stay
// single-source.
const TokenResponse: JsonSchema = {
  type: "object",
  properties: {
    token: { type: "string", description: "Signed HS256 JWT, valid for 15 minutes." },
    expiresAt: { type: "string", format: "date-time" },
  },
  required: ["token", "expiresAt"],
  additionalProperties: false,
}

const HealthResponse: JsonSchema = {
  type: "object",
  properties: { status: { type: "string", const: "ok" } },
  required: ["status"],
  additionalProperties: false,
}

const TransactionsResponse: JsonSchema = {
  type: "object",
  properties: {
    ownerId: { type: "string" },
    transactions: { type: "array", items: ref("CoinTransactionRecord") },
  },
  required: ["ownerId", "transactions"],
  additionalProperties: false,
}

/** The standardized error envelope from `lib/errors.ts`: `{ error: { code, message } }`. */
const Error_: JsonSchema = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string" },
        message: { type: "string" },
      },
      required: ["code", "message"],
      additionalProperties: false,
    },
  },
  required: ["error"],
  additionalProperties: false,
}

/** All `components.schemas`, keyed by their `$ref` name. */
export const componentSchemas: Record<string, JsonSchema> = {
  TokenRequest,
  TokenResponse,
  AmountRequest,
  CoinBalanceRecord,
  CoinTransactionRecord,
  TransactionsResponse,
  HealthResponse,
  Error: Error_,
}

/**
 * Schema for the `limit` query parameter of `GET /api/coins/transactions`,
 * extracted from the SAME `transactionsQuerySchema` (input mode) so it reflects
 * what the client actually sends (optional, coerced integer, default 50).
 */
export const limitParameterSchema: JsonSchema = ((): JsonSchema => {
  const query = toJsonSchema(transactionsQuerySchema, "input")
  const properties = (query["properties"] ?? {}) as Record<string, JsonSchema>
  return properties["limit"] ?? {}
})()

/** Schema for the optional `Idempotency-Key` header, from the SAME `idempotencyKeySchema` the routes validate with. */
export const idempotencyKeyHeaderSchema: JsonSchema = toJsonSchema(idempotencyKeySchema, "input")

/** Reusable `$ref` helper for building the paths object. */
export const schemaRef = ref
