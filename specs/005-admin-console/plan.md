# Implementation Plan: Admin Console — Products, Users & AI Image Generator

**Branch**: `005-admin-console` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-admin-console/spec.md`

## Summary

Adds a role concept (`collector` | `admin`) to the auth domain, a new admin-only area
(`/admin/products`, `/admin/users`) gated by an async route guard, and the two minimum CRUD
surfaces the spec requires: NFT listing/edition management and user search/suspend/reactivate.
Inside the listing form, a mocked "AI" image generator produces a deterministic SVG from a text
prompt — same prompt always yields the same image, entirely simulated (no external dependency,
no network call to a real provider), per the feature's explicit stack constraint. One pre-existing
fixture user (`usr_ana`) becomes the sole seed administrator; self-serve signup can never create one.

## Technical Context

**Language/Version**: TypeScript ~6.0 (React 19.2) — unchanged

**Primary Dependencies**: TanStack Router (new `beforeLoad` guard using `queryClient.ensureQueryData`,
already-wired `RouterContext`), TanStack Query, Axios (existing `http` client), MSW (new `admin` and
`media-generation` mock contexts); **no new runtime dependency** — this is a hard constraint from the
spec's Assumptions (explicit stack constraint, reaffirmed 2026-10-21)

**Storage**: N/A — role/status live as new fields on the existing in-memory `UserRecord`
(`src/mocks/state.ts`); no persistence beyond the existing mock store

**Testing**: Playwright (new `e2e/admin-products`, `e2e/admin-users` folders), oxlint, `pnpm typecheck`,
`pnpm build`

**Target Platform**: Web (same breakpoints 390/768/1440)

**Project Type**: web-application (same SPA; adds one new domain for admin operations, one new
small domain for the image generator, two new admin-only pages)

**Performance Goals**: no new targets

**Constraints**: zero new dependencies (verified stack constraint); admin area MUST be unreachable
by non-admins even via direct URL (FR-004); artwork generation MUST be fully deterministic and
fully simulated (FR-013/FR-014); suspending the sole remaining admin MUST be blocked (FR-011)

**Scale/Scope**: 1 new field on `SessionUser`/`UserRecord` (`role`), 1 new field on `UserRecord`
(`status`), 1 new route guard, 2 new pages, 1 new domain (`admin`), 1 new small domain
(`media-generation`), 2 new mock contexts, 2 new e2e folders

## Constitution Check

*GATE: passou antes da Fase 0; reavaliado após a Fase 1 — ver notas abaixo.*

| Princípio | Avaliação |
|-----------|-----------|
| I. Camadas e fronteiras | OK. Novo domínio `admin` (depende das APIs públicas de `catalog`/`auth`, nunca o inverso); novo domínio `media-generation` independente; duas pastas de página novas (`admin-products`, `admin-users`), cada uma com seu próprio README; nenhuma página importa outra. |
| II. Tipagem estrita | OK. `UserRole`, `UserAccountStatus`, `AdminNftListing`, `GeneratedImage` etc. tipados em `model/contracts.ts`; sem `any`. |
| III. Estado remoto | OK. Mutations de admin (criar/editar/delistar anúncio, suspender/reativar usuário) e a geração de imagem usam TanStack Query/mutations como todo o resto do app. |
| IV. Tempo real | Mutations de listing (preço/estoque) continuam emitindo `nft.updated` via o `MockRealtimeServer` já existente — nenhuma mudança de protocolo. |
| V. Mocks só em `src/mocks` | OK, e é o ponto central desta feature: o gerador de imagem é 100% simulado dentro de `src/mocks`, determinístico (mesmo prompt ⇒ mesma imagem), reaproveitando a lógica de `scripts/generate-art.mjs`. |
| VI. Acessibilidade/responsividade/fidelidade | Aplicável às 2 telas novas (390/768/1440, axe, teclado, foco). |
| VII. Testes e auditoria | `e2e/admin-products/`, `e2e/admin-users/` cobrem o fluxo feliz e os dois casos de segurança centrais (FR-004: não-admin bloqueado; FR-011: não pode suspender o único admin). |

Sem violações. Nenhuma linha em Complexity Tracking é necessária — a feature inteira já é a
justificativa para a conformidade que faltava (Princípio III já cumprido, mas sem exercício
administrativo ainda).

## Project Structure

### Documentation (this feature)

```text
specs/005-admin-console/
├── plan.md              # este arquivo
├── research.md          # Fase 0 — decisões D1-D5
├── data-model.md         # Fase 1 — Role/Status/AdminNftListing/GeneratedImage
├── quickstart.md         # Fase 1 — como validar a área admin e o gerador de imagem
├── contracts/
│   ├── admin-products.md
│   ├── admin-users.md
│   └── media-generation.md
└── tasks.md              # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
src/domains/auth/
├── model/contracts.ts            # + UserRole, SessionUser.role (required)
├── model/role-guard.ts            # + requireRole(href, context, role) (novo arquivo)
└── api/queries.ts                 # sessionQueryOptions já existente, reaproveitado pelo guard

src/domains/admin/
├── model/contracts.ts             # AdminNftListing, AdminUserSummary, AdminUserDetail, UserAccountStatus
├── api/queries.ts                  # useAdminNfts, useCreateListing, useUpdateListing, useDelistNft,
│                                    # useAdminUsers, useAdminUser, useSuspendUser, useReactivateUser
├── components/AdminSideMenu.tsx
├── index.ts
└── README.md

src/domains/media-generation/
├── model/contracts.ts             # GenerateImageRequest, GeneratedImage
├── api/queries.ts                  # useGenerateImage()
├── index.ts
└── README.md

src/mocks/contexts/admin/
├── guard.ts                        # requireAdmin(auth, request) → throws errors.forbidden()
├── service.ts                      # AdminService (injected with existing CatalogRepository/UserRepository)
└── handlers.ts

src/mocks/contexts/media-generation/
├── service.ts                      # hashes prompt → seed → deterministic SVG (reuses shared drawer)
└── handlers.ts

src/mocks/infra/placeholder-art.ts  # drawing logic extracted so scripts/generate-art.mjs and the
                                     # mock service share exactly one implementation

src/app/routes/
├── admin.products.tsx              # beforeLoad: requireRole(..., 'admin')
└── admin.users.tsx                 # beforeLoad: requireRole(..., 'admin')

src/pages/admin-products/
├── AdminProductsPage.tsx
├── components/{ListingForm,ListingTable,GenerateImageButton}.tsx
├── index.ts
└── README.md

src/pages/admin-users/
├── AdminUsersPage.tsx
├── components/{UserSearch,UserDetailPanel}.tsx
├── index.ts
└── README.md

e2e/admin-products/admin-products.spec.ts
e2e/admin-users/admin-users.spec.ts
```

**Structure Decision**: segue exatamente o padrão já usado pelas features 002/003/004 — um domínio
por contexto delimitado, uma pasta por tela, um contexto de mock por domínio injetado com os
repositórios já existentes via `src/mocks/composition.ts`. Nenhuma estrutura nova além disso.

## Complexity Tracking

Sem violações da constituição; nada a justificar.
