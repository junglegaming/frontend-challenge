import { z } from 'zod'

import { walletProviderSchema } from './account'
import { ethSchema, idSchema, isoDateSchema } from './common'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'declined'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

/** Item do pedido — snapshot imutável no momento da criação (recibo). */
export const orderItemSnapshotSchema = z.object({
  nftId: idSchema,
  editionId: idSchema,
  name: z.string(),
  quantity: z.number().int().min(1),
  priceEth: ethSchema,
  imageUrl: z.string(),
})
export type OrderItemSnapshot = z.infer<typeof orderItemSnapshotSchema>

/** Carteira usada no pagamento — snapshot do momento da compra. */
export const paymentSnapshotSchema = z.object({
  walletAddress: z.string(),
  network: z.string(),
  provider: walletProviderSchema,
})
export type PaymentSnapshot = z.infer<typeof paymentSnapshotSchema>

export const orderSchema = z.object({
  id: idSchema,
  status: orderStatusSchema,
  items: z.array(orderItemSnapshotSchema),
  /** `null` só em pedidos criados antes deste campo existir. */
  payment: paymentSnapshotSchema.nullable(),
  subtotalEth: ethSchema,
  discountEth: ethSchema,
  networkFeeEth: ethSchema,
  totalEth: ethSchema,
  transactionRef: z.string().nullable(),
  version: z.number().int().min(0),
  createdAt: isoDateSchema,
})
export type Order = z.infer<typeof orderSchema>

/**
 * Criação de pedido. `Idempotency-Key` é obrigatória no header HTTP.
 * Mesma chave + mesmo corpo = mesmo pedido; chave reusada com corpo diferente = 409
 * (`IDEMPOTENCY_CONFLICT`).
 *
 * `expectedTotalEth` é o total que o usuário revisou: se a cotação atual divergir
 * (preço, estoque, cupom ou taxa), a API responde 409 `STALE_QUOTE` e exige nova
 * confirmação. `connectionId` vem da conexão simulada da carteira escolhida.
 */
export const createOrderRequestSchema = z.object({
  items: z.array(
    z.object({
      nftId: idSchema,
      editionId: idSchema,
      quantity: z.number().int().min(1),
    }),
  ),
  couponCode: z.string().optional(),
  walletId: idSchema,
  connectionId: idSchema,
  network: z.string().min(1),
  expectedTotalEth: ethSchema,
})
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>
