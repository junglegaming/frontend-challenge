import { z } from 'zod'
import { buyerSchema } from '@/schemas/order'

export const checkoutFormSchema = buyerSchema.pick({
  displayName: true,
  username: true,
  profileName: true,
  email: true,
  note: true,
})
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>
