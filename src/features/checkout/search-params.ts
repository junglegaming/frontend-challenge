import { z } from 'zod';
export const checkoutSearchSchema = z.object({ coupon: z.string().optional() });
