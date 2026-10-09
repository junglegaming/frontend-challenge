import { z } from 'zod';

const ethRegex = /^\d+(\.\d{1,18})?$/;

export const ethSchema = z
  .string()
  .regex(ethRegex, 'Valor ETH inválido (ex.: 0.05)');

export const isoDateSchema = z.iso.datetime();

export const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço inválido');

export const uuidSchema = z.uuid('Identificador inválido');

export const idempotencyKeySchema = z.uuidv4('Chave de idempotência inválida');

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INSUFFICIENT_STOCK',
  'QUOTE_STALE',
  'IDEMPOTENCY_CONFLICT',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'RATE_LIMITED',
  'INTERNAL',
  'SERVICE_UNAVAILABLE',
]);

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.array(z.string())).optional(),
    requestId: z.string().optional(),
  }),
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

const pageSizeMessage = 'pageSize deve estar entre 1 e 48';

export const pageSchema = z.coerce
  .number('Página inválida')
  .int('Página inválida')
  .min(1, 'Página inválida')
  .default(1);

export const pageSizeSchema = z.coerce
  .number(pageSizeMessage)
  .int(pageSizeMessage)
  .min(1, pageSizeMessage)
  .max(48, pageSizeMessage)
  .default(12);

export const listMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
});

export type ListMeta = z.infer<typeof listMetaSchema>;

const passwordRuleSchema = z
  .string('Senha inválida')
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), {
    message: 'Senha deve conter letra e número',
  });

const nameMessage = 'Nome deve ter entre 2 e 60 caracteres';

export const userPublicSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  username: z.string().optional(),
  profileName: z.string().optional(),
  referralCode: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  createdAt: isoDateSchema,
});

export const sessionSchema = z.object({
  token: z.string(),
  user: userPublicSchema,
  expiresAt: isoDateSchema,
});

export const signupRequestSchema = z.object({
  name: z.string(nameMessage).min(2, nameMessage).max(60, nameMessage),
  email: z.email('E-mail inválido'),
  password: passwordRuleSchema,
});

export const loginRequestSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string('Senha inválida').min(1, 'Senha inválida'),
  anonymousId: uuidSchema.optional(),
});

export type UserPublic = z.infer<typeof userPublicSchema>;

export type Session = z.infer<typeof sessionSchema>;

export type SignupRequest = z.infer<typeof signupRequestSchema>;

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const editionSchema = z.object({
  current: z.number().int().min(0),
  total: z.number().int().min(1),
});

export type Edition = z.infer<typeof editionSchema>;

export const nftCreatorSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const raritySchema = z.enum(['RARO', 'COMUM', 'ÚNICO']);

export type Rarity = z.infer<typeof raritySchema>;

export const catalogNetworkSchema = z.enum(['ethereum', 'polygon', 'solana']);
export type CatalogNetwork = z.infer<typeof catalogNetworkSchema>;

export const nftSchema = z.object({
  id: z.string(),
  name: z.string(),
  collection: z.string(),
  creator: nftCreatorSchema,
  edition: editionSchema,
  price: ethSchema,
  previousPrice: ethSchema.optional(),
  categories: z.array(z.string()),
  network: catalogNetworkSchema,
  image: z.string(),
  images: z.array(z.string()).min(1),
  description: z.string(),
  tokenId: z.string().optional(),
  details: z.string().optional(),
  contract: z
    .object({
      address: z.string(),
      standard: z.string(),
      verified: z.boolean(),
      royalties: z.string(),
    })
    .optional(),
  reviews: z
    .object({
      average: z.number().min(0).max(5),
      count: z.number().int().min(0),
      items: z.array(
        z.object({
          id: z.string(),
          author: z.string(),
          rating: z.number().min(0).max(5),
          comment: z.string(),
          date: isoDateSchema,
        })
      ),
    })
    .optional(),
  editable: z.boolean(),
  available: z.number().int().min(0),
  favoritesCount: z.number().int().min(0),
  rarity: raritySchema.optional(),
  attributes: z
    .array(z.object({ trait: z.string(), value: z.string() }))
    .optional(),
  version: z.number().int(),
  updatedAt: isoDateSchema,
  createdAt: isoDateSchema,
});

export const nftSortSchema = z.enum(
  ['relevance', 'recent', 'price_asc', 'price_desc', 'popular'],
  'Ordenação inválida'
);

export type NftSort = z.infer<typeof nftSortSchema>;

export const catalogFacetsSchema = z.object({
  categories: z.array(
    z.object({ id: z.string(), count: z.number().int().nonnegative() })
  ),
  networks: z.array(
    z.object({
      id: catalogNetworkSchema,
      count: z.number().int().nonnegative(),
    })
  ),
});
export type CatalogFacets = z.infer<typeof catalogFacetsSchema>;

export const optionalBooleanQuerySchema = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => value === true || value === 'true')
  .optional();

export const nftListQuerySchema = z.object({
  favoritesOnly: optionalBooleanQuerySchema,
  networks: z
    .union([catalogNetworkSchema, z.array(catalogNetworkSchema)])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional(),
  q: z.string('Busca inválida').optional(),
  categories: z
    .union([z.string(), z.array(z.string())], 'Categorias inválidas')
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional(),
  minPrice: z
    .string('Preço inválido')
    .regex(ethRegex, 'Preço inválido')
    .optional(),
  maxPrice: z
    .string('Preço inválido')
    .regex(ethRegex, 'Preço inválido')
    .optional(),
  sort: nftSortSchema.default('relevance'),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const nftListResponseSchema = listMetaSchema.extend({
  items: z.array(nftSchema),
  facets: catalogFacetsSchema,
});

export type Nft = z.infer<typeof nftSchema>;

export type NftListQuery = z.infer<typeof nftListQuerySchema>;

export type NftListResponse = z.infer<typeof nftListResponseSchema>;

export const favoritesResponseSchema = z.object({
  ids: z.array(z.string()),
  count: z.number().int().min(0),
});

export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>;

export const cartItemSchema = z.object({
  nftId: z.string(),
  tokenId: z.string().optional(),
  name: z.string(),
  image: z.string(),
  price: ethSchema,
  qty: z.number().int().min(1),
  available: z.number().int().min(0),
  edition: editionSchema,
  lineTotal: ethSchema,
  updatedAt: isoDateSchema,
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  subtotal: ethSchema,
  itemCount: z.number().int().min(0),
  updatedAt: isoDateSchema,
  version: z.number().int(),
});

const qtyMessage = 'Quantidade inválida';

export const addCartItemRequestSchema = z.object({
  nftId: z.string('NFT inválido').min(1, 'NFT inválido'),
  qty: z.number(qtyMessage).int(qtyMessage).min(1, qtyMessage),
});

export const patchCartItemRequestSchema = z.object({
  qty: z.number(qtyMessage).int(qtyMessage).min(1, qtyMessage),
});

export type CartItem = z.infer<typeof cartItemSchema>;

export type Cart = z.infer<typeof cartSchema>;

export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>;

export type PatchCartItemRequest = z.infer<typeof patchCartItemRequestSchema>;

export const couponTypeSchema = z.enum(['percent', 'fixed']);

export type CouponType = z.infer<typeof couponTypeSchema>;

export const couponSchema = z.object({
  code: z.string(),
  type: couponTypeSchema,
  value: z.number(),
  description: z.string(),
  expiresAt: isoDateSchema.optional(),
});

export const quoteRequestSchema = z.object({
  coupon: z.string('Cupom inválido').min(1, 'Cupom inválido').optional(),
});

export const quoteItemSchema = z.object({
  nftId: z.string(),
  qty: z.number().int().min(1),
  unitPrice: ethSchema,
  available: z.number().int().min(0),
});

export const quoteSchema = z.object({
  subtotal: ethSchema,
  discount: ethSchema,
  networkFee: ethSchema,
  total: ethSchema,
  currency: z.literal('ETH'),
  coupon: couponSchema.nullable(),
  quoteVersion: z.number().int(),
  items: z.array(quoteItemSchema),
  available: z.boolean(),
  updatedAt: isoDateSchema,
});

export const couponValidateRequestSchema = z.object({
  code: z
    .string('Informe o código do cupom')
    .min(1, 'Informe o código do cupom'),
});

export const couponValidateResponseSchema = z.object({
  coupon: couponSchema,
});

export type Coupon = z.infer<typeof couponSchema>;

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export type QuoteItem = z.infer<typeof quoteItemSchema>;

export type Quote = z.infer<typeof quoteSchema>;

export type CouponValidateRequest = z.infer<typeof couponValidateRequestSchema>;

export type CouponValidateResponse = z.infer<
  typeof couponValidateResponseSchema
>;

export const networkSchema = z.enum(['ethereum', 'sepolia'], 'Rede inválida');

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'declined']);

export const orderItemSchema = z.object({
  nftId: z.string(),
  name: z.string(),
  image: z.string(),
  edition: editionSchema,
  qty: z.number().int().min(1),
  unitPrice: ethSchema,
  lineTotal: ethSchema,
});

export const orderCouponSchema = z.object({
  code: z.string(),
  type: couponTypeSchema,
  value: z.number(),
});

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  items: z.array(orderItemSchema),
  subtotal: ethSchema,
  discount: ethSchema,
  networkFee: ethSchema,
  total: ethSchema,
  currency: z.literal('ETH'),
  coupon: orderCouponSchema.nullable(),
  wallet: z.object({
    id: z.string(),
    label: z.string(),
    address: addressSchema,
    provider: z.enum(['metamask', 'walletconnect', 'coinbase']).optional(),
    ensName: z.string().optional(),
    secondaryIdentity: z.string().optional(),
    note: z.string().optional(),
  }),
  collector: z
    .object({
      name: z.string(),
      email: z.email(),
      username: z.string().optional(),
      profileName: z.string().optional(),
      referralCode: z.string().optional(),
    })
    .optional(),
  network: networkSchema,
  txHash: z.string().optional(),
  explorerUrl: z.string().optional(),
  declineReason: z.string().optional(),
  quoteVersion: z.number().int(),
  idempotencyKey: z.string(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  version: z.number().int(),
});

export const createOrderRequestSchema = z.object({
  coupon: z.string('Cupom inválido').nullish(),
  walletId: z.string('Carteira inválida').min(1, 'Carteira inválida'),
  network: networkSchema,
  quoteVersion: z
    .number('Versão da cotação inválida')
    .int('Versão da cotação inválida'),
});

export type OrderCoupon = z.infer<typeof orderCouponSchema>;

export type Network = z.infer<typeof networkSchema>;

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export type OrderItem = z.infer<typeof orderItemSchema>;

export type Order = z.infer<typeof orderSchema>;

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

const avatarDataUrlRegex =
  /^data:image\/(?:png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;

const isAvatarDataUrl = (v: string): boolean => {
  const match = avatarDataUrlRegex.exec(v);
  if (!match) return false;
  const base64 = match[1];
  if (base64.length % 4 !== 0) return false;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const bytes = (base64.length * 3) / 4 - padding;
  return bytes <= 512 * 1024;
};

export const avatarDataUrlSchema = z
  .string('Avatar inválido')
  .refine(isAvatarDataUrl, {
    message: 'Avatar deve ser data URL PNG ou JPEG de até 512 KB',
  });

export const usernameSchema = z
  .string('Username deve ter 3–30 caracteres (a–z, 0–9, ., _)')
  .regex(
    /^[a-z0-9._]{3,30}$/,
    'Username deve ter 3–30 caracteres (a–z, 0–9, ., _)'
  );

export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  username: z.string().optional(),
  profileName: z.string().optional(),
  referralCode: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  createdAt: isoDateSchema,
  walletCount: z.number().int().min(0),
});

export const profilePatchSchema = z.object({
  email: z.email('E-mail inválido').optional(),
  profileName: z.string().min(2, nameMessage).max(60, nameMessage).optional(),
  referralCode: z
    .string()
    .trim()
    .max(40, 'Código de indicação deve ter até 40 caracteres')
    .regex(/^[a-zA-Z0-9_ -]*$/, 'Código de indicação inválido')
    .optional(),
  name: z
    .string(nameMessage)
    .min(2, nameMessage)
    .max(60, nameMessage)
    .optional(),
  username: usernameSchema.optional(),
  bio: z
    .string('Bio inválida')
    .max(280, 'Bio deve ter no máximo 280 caracteres')
    .optional(),
  avatarUrl: avatarDataUrlSchema.nullable().optional(),
});

export const passwordRequestSchema = z
  .object({
    currentPassword: z
      .string('Senha atual inválida')
      .min(1, 'Informe a senha atual'),
    newPassword: passwordRuleSchema,
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['newPassword'],
  });

export type AvatarDataUrl = z.infer<typeof avatarDataUrlSchema>;

export type Profile = z.infer<typeof profileSchema>;

export type ProfilePatch = z.infer<typeof profilePatchSchema>;

export type PasswordRequest = z.infer<typeof passwordRequestSchema>;

export const walletProviderSchema = z.enum([
  'metamask',
  'walletconnect',
  'coinbase',
]);
export const ensNameSchema = z
  .string()
  .regex(
    /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.eth)?$/,
    'Informe um nome ENS válido terminado em .eth'
  );
export const secondaryIdentitySchema = z
  .string()
  .refine(
    (value) =>
      value === '' ||
      addressSchema.safeParse(value).success ||
      (value.endsWith('.eth') && ensNameSchema.safeParse(value).success),
    'Informe um endereço 0x válido ou nome .eth'
  );
export const walletSchema = z.object({
  id: z.string(),
  label: z.string(),
  address: addressSchema,
  network: networkSchema,
  isPrimary: z.boolean(),
  ensName: z.string().optional(),
  provider: walletProviderSchema.optional(),
  secondaryIdentity: secondaryIdentitySchema.optional(),
  note: z.string().optional(),
  createdAt: isoDateSchema,
});

export const walletsListResponseSchema = z.object({
  items: z.array(walletSchema),
});

const walletLabelMessage = 'Nome da carteira inválido';

const walletPrimaryMessage = 'Informe se a carteira é a principal';

export const createWalletRequestSchema = z.object({
  label: z.string(walletLabelMessage).min(1, walletLabelMessage),
  address: addressSchema,
  network: networkSchema,
  isPrimary: z.boolean(walletPrimaryMessage),
  ensName: ensNameSchema.optional(),
  provider: walletProviderSchema.optional(),
  secondaryIdentity: secondaryIdentitySchema.optional(),
  note: z.string('Observação inválida').optional(),
});

export const patchWalletRequestSchema = z.object({
  address: addressSchema.optional(),
  provider: walletProviderSchema.optional(),
  ensName: ensNameSchema.optional(),
  secondaryIdentity: secondaryIdentitySchema.optional(),
  label: z.string(walletLabelMessage).min(1, walletLabelMessage).optional(),
  note: z.string('Observação inválida').optional(),
  isPrimary: z.boolean(walletPrimaryMessage).optional(),
  network: networkSchema.optional(),
});

export type Wallet = z.infer<typeof walletSchema>;

export type WalletsListResponse = z.infer<typeof walletsListResponseSchema>;

export type CreateWalletRequest = z.infer<typeof createWalletRequestSchema>;

export type PatchWalletRequest = z.infer<typeof patchWalletRequestSchema>;

export const SCENARIO_IDS = [
  'padrao',
  'vazio',
  'lento',
  'latencia-varia',
  'offline',
  'erro-5xx',
  'erro-4xx',
  'sessao-expirada',
  'nao-autorizado',
  'cadastro-conflito',
  'validacao-api',
  'cupom-ruim',
  'preco-muda',
  'estoque-esgotado',
  'timeout-pedido',
  'pagamento-confirmado',
  'pagamento-recusado',
  'socket-queda',
] as const;

export const scenarioIdSchema = z.enum(SCENARIO_IDS, 'Cenário inválido');

export const scenarioSourceSchema = z.enum([
  'url',
  'runtime',
  'storage',
  'env',
  'default',
]);

export const resetResponseSchema = z.object({
  ok: z.literal(true),
});

export const scenarioStateSchema = z.object({
  id: scenarioIdSchema,
  source: scenarioSourceSchema,
});

export const setScenarioRequestSchema = z.object({
  id: scenarioIdSchema,
});

export const setScenarioResponseSchema = z.object({
  ok: z.literal(true),
  id: scenarioIdSchema,
});

export type ScenarioId = z.infer<typeof scenarioIdSchema>;

export type ScenarioSource = z.infer<typeof scenarioSourceSchema>;

export type ResetResponse = z.infer<typeof resetResponseSchema>;

export type ScenarioState = z.infer<typeof scenarioStateSchema>;

export type SetScenarioRequest = z.infer<typeof setScenarioRequestSchema>;

export type SetScenarioResponse = z.infer<typeof setScenarioResponseSchema>;
export const healthSchema = z.object({ ok: z.literal(true) });
