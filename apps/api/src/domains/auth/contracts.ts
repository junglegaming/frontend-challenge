import { z } from "zod"

/**
 * Request body for `POST /api/auth/token`.
 *
 * Centralized here (single source) so both the route's runtime validation and
 * the OpenAPI generation use the exact same schema — the doc cannot drift from
 * what is actually validated. Moved verbatim from `routes/auth.ts`.
 */
export const tokenRequestSchema = z.object({
  ownerId: z.string().trim().min(1),
})

export type TokenRequest = z.infer<typeof tokenRequestSchema>
