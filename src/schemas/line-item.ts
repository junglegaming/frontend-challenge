import { z } from 'zod'
import { ethSchema } from './common'
import { editionIdSchema, nftImageSchema } from './nft'

/** Linha de valores congelados (cotação, recibo). */
export const lineItemSchema = z.object({
  nftId: z.string(),
  editionId: editionIdSchema,
  name: z.string(),
  image: nftImageSchema,
  tokenId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: ethSchema,
  lineTotal: ethSchema,
})
export type LineItem = z.infer<typeof lineItemSchema>
