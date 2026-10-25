import { z } from 'zod'
import { usernameSchema } from './auth'
import { networkSchema, summarySchema } from './common'
import { lineItemSchema } from './line-item'
import { addressSchema, ensNameSchema, walletProviderSchema } from './wallet'

/** Formulário "Perfil do colecionador" do Pagamento (Figma) */
export const buyerSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição'),
  username: usernameSchema,
  network: networkSchema,
  profileName: z.string().trim().min(2, 'Informe o nome do perfil'),
  address: addressSchema,
  secondaryAddress: z.string().trim().max(64).optional().or(z.literal('')),
  provider: walletProviderSchema,
  referralCode: z.string().trim().min(4, 'Informe o código de indicação'),
  email: z.email('E-mail inválido'),
  ensName: ensNameSchema,
  note: z.string().trim().max(500, 'Máximo de 500 caracteres').optional().or(z.literal('')),
})
export type Buyer = z.infer<typeof buyerSchema>

export const createOrderInputSchema = z.object({
  quoteId: z.string(),
  walletId: z.string(),
  network: networkSchema,
  buyer: buyerSchema,
})
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

/** Snapshot imutável no momento da criação do pedido */
export const receiptSchema = summarySchema.extend({
  items: z.array(lineItemSchema),
  couponCode: z.string().nullable(),
  network: networkSchema,
  walletLabel: z.string(),
  txHash: z.string(),
  explorerUrl: z.string(),
  createdAt: z.string(),
})
export type Receipt = z.infer<typeof receiptSchema>

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  receipt: receiptSchema,
  confirmedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  version: z.number().int(),
})
export type Order = z.infer<typeof orderSchema>
