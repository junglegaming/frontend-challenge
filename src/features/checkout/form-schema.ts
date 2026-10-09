import { z } from 'zod';
import {
  profilePatchSchema,
  addressSchema,
  networkSchema,
  walletProviderSchema,
  ensNameSchema,
  secondaryIdentitySchema,
  usernameSchema,
} from '@/lib/http/schemas';
export const collectorFormSchema = z.object({
  name: profilePatchSchema.shape.name.unwrap(),
  username: usernameSchema,
  profileName: profilePatchSchema.shape.profileName.unwrap(),
  email: profilePatchSchema.shape.email.unwrap(),
  referralCode: profilePatchSchema.shape.referralCode
    .unwrap()
    .min(1, 'Informe o código de indicação'),
  address: addressSchema,
  network: networkSchema,
  provider: walletProviderSchema,
  secondaryIdentity: secondaryIdentitySchema,
  ensName: ensNameSchema.min(1, 'Selecione o nome ENS'),
  note: z.string().max(280, 'Observação deve ter até 280 caracteres'),
});
export type CollectorFormValues = z.infer<typeof collectorFormSchema>;
