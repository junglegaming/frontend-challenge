import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AVAILABILITY_FILTERS, CATALOG_SORTS, NFT_CATEGORIES } from '@/domains/catalog'
import { HomePage } from '@/pages/home'

// The router's default search parser turns a numeric-looking query value (e.g. `minPrice=999`)
// into a JS number, even though the catalog API expects decimal-string ETH amounts — normalize back.
const ethAmountSearch = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .optional()

const homeSearchSchema = z.object({
  q: z.string().optional(),
  category: z.array(z.enum(NFT_CATEGORIES)).optional(),
  availability: z.enum(AVAILABILITY_FILTERS).optional(),
  minPrice: ethAmountSearch,
  maxPrice: ethAmountSearch,
  sort: z.enum(CATALOG_SORTS).optional(),
  page: z.number().int().positive().optional(),
  /** Set by `requireRole` when a non-admin is redirected away from an admin-only route. */
  forbidden: z.literal(true).optional(),
})

export const Route = createFileRoute('/')({
  validateSearch: homeSearchSchema,
  component: HomePage,
})
