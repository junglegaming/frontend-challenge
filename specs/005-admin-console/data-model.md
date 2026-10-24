# Data Model: Admin Console — Products, Users & AI Image Generator

## Role & Status (extend existing entities — `src/domains/auth`)

```ts
export type UserRole = 'collector' | 'admin'
export type UserAccountStatus = 'active' | 'suspended'
```

- `SessionUser` (`src/domains/auth/model/contracts.ts`) gains a required `role: UserRole` field.
- `UserRecord` (`src/mocks/state.ts`) gains `role: UserRole` and `status: UserAccountStatus`.
- **Seeding rule** (research.md D1): exactly `usr_ana` starts as `role: 'admin'`; every other
  fixture user and every signup-created user is `role: 'collector'`. Every fixture user starts
  `status: 'active'`.
- **Invariant** (FR-011): the system MUST reject a suspend operation that would leave zero active
  administrators. Enforced in `AdminService.suspendUser` by counting active admins before applying
  the change.

## AdminNftListing / AdminNftEdition (new — `src/domains/admin/model/contracts.ts`)

Admin-facing view over the existing `Nft`/`NftEdition` (`@/domains/catalog`) — no new fields on the
underlying entity, just the request/response shapes admin mutations use:

```ts
export interface CreateListingRequest {
  name: string
  category: NftCategory          // from @/domains/catalog
  description: string
  collection: string
  image: NftImage                 // from @/domains/catalog, e.g. a GeneratedImage result
  edition: { name: string; price: EthAmount; supply: number; maxPerOrder: number }
}

export interface UpdateEditionRequest {
  price?: EthAmount
  available?: number
}
```

**Validation rules**: `name` non-empty (reuses the same length bounds as other name fields in the
app, 3–60 chars per `validateName`-style convention); `edition.supply`/`maxPerOrder` positive
integers; `price` a decimal string matching the existing `DECIMAL` pattern used by the catalog
search endpoint (`src/mocks/contexts/catalog/handlers.ts`). Delisting (FR-007) sets the NFT's
status so it's excluded from public catalog queries but is **not** removed from `nfts` state — any
`OrderRecord` that already references it keeps working unchanged (no cascade).

## AdminUserSummary / AdminUserDetail (new — `src/domains/admin/model/contracts.ts`)

```ts
export interface AdminUserSummary {
  id: string
  name: string
  email: string
  username: string
  role: UserRole
  status: UserAccountStatus
}

export interface AdminUserDetail extends AdminUserSummary {
  bio: string
  avatarUrl: string | null
  updatedAt: string
}
```

Derived directly from `UserRecord` (no new storage) — same relationship pattern as `creators` in
feature 004 (a read/admin-shaped projection over an existing record, not a new aggregate).

**State transitions** (`status`): `active → suspended` (suspend; also deletes all of that user's
`SessionRecord`s, per FR-009) and `suspended → active` (reactivate). Both are admin-only mutations;
no other transition exists.

## GeneratedImage (new — `src/domains/media-generation/model/contracts.ts`)

```ts
export interface GenerateImageRequest {
  prompt: string   // rejected if empty/whitespace-only (FR-015)
}

export interface GeneratedImage extends NftImage {   // NftImage from @/domains/catalog
  prompt: string
  seed: number
}
```

**Determinism rule** (FR-013): for a given `prompt` string, `seed` and therefore the resulting
`src` (SVG data URI) are always identical — `seed = fnv1a(prompt)`, pure function of the input, no
randomness beyond the deterministic PRNG seeded by it (research.md D5).
