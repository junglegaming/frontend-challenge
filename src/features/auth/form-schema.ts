import { z } from 'zod';
import { loginRequestSchema, signupRequestSchema } from '@/lib/http/schemas';

export const loginFormSchema = loginRequestSchema.omit({ anonymousId: true });
export const signupFormSchema = signupRequestSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas devem ser iguais',
  });
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type SignupFormValues = z.infer<typeof signupFormSchema>;
