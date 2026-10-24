# Feature Specification: Storefront Expansion — Mercado, Criadores, Aprenda

**Feature Branch**: `004-storefront-expansion`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "Expansão da vitrine pública: construir destinos reais para os 3 links de navegação hoje desabilitados em `src/app/layout/nav-items.ts` (Mercado, Criadores, Aprenda — `to: null, enabled: false`). (1) Mercado (`/market`): um hub de descoberta curado, complementar ao catálogo já existente em `/` (que já cobre busca/filtro/grid/paginação) — ladrilhos de categoria, uma faixa \"em alta\" (reaproveitando `catalogQueries.featured()`), e uma faixa de \"coleções\" agrupada no cliente pelo campo já existente `Nft.collection`; cada ladrilho/faixa navega para `/` com `category`/`q` pré-definidos, sem grid ou paginação própria. (2) Criadores (`/creators` e `/creators/$creatorId`): um diretório de criadores (grid de cards: avatar, nome, quantidade de NFTs) e uma página de detalhe por criador (bio + grid de NFTs do criador, reaproveitando `NftCard`); exige um novo domínio pequeno `creators` e novos endpoints de mock somente leitura, derivados dos NFTs já existentes agrupados por `artist.id` (sem fixtures novas). (3) Aprenda (`/learn` e `/learn/$slug`): conteúdo editorial estático sobre NFTs (lista de artigos + detalhe por slug), sem necessidade de mock/backend, já que não é dado de usuário/sessão. Ao final, os 3 itens de navegação em `nav-items.ts` devem virar `enabled: true` com rotas reais; o item `Favoritos` permanece intocado (fora de escopo). Cada tela nova segue a convenção existente (uma pasta por tela em `src/pages/<tela>`, README, testes e2e Playwright por pasta com baseline visual 390/768/1440 + verificação de acessibilidade via axe, seguindo o padrão de `e2e/home/catalog.spec.ts`). Não há acesso confirmado ao arquivo de referência do Figma para estas 3 telas; a estrutura de conteúdo foi definida a partir de primeiros princípios e a fidelidade visual exata deverá ser revisada depois, quando o acesso for resolvido — isso deve ficar registrado como uma suposição/risco aceito na spec, não como bloqueador."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover NFTs through curated rails (Priority: P1)

A visitor taps the "Mercado" link in the navigation (today disabled) and lands on a curated discovery hub showing NFT categories, a trending rail, and a collections rail, distinct from the general browse/filter/search experience already on the home page.

**Why this priority**: "Mercado" is the most prominent of the three disabled nav links (shown in both the navbar and the mobile dock) and gives the clearest, most immediate value: a second entry point into the existing catalog, curated rather than search-driven.

**Independent Test**: Load the Mercado screen on its own, confirm category tiles, a trending rail and a collections rail render with real data, and confirm selecting a tile or rail item takes the visitor to the home/catalog screen pre-filtered to match.

**Acceptance Scenarios**:

1. **Given** a visitor on any screen, **When** they select "Mercado" from the navigation, **Then** they reach a discovery screen showing NFT categories, a trending selection and a collections grouping, without needing to sign in.
2. **Given** the Mercado screen, **When** the visitor selects a category tile, **Then** they land on the home/catalog screen already filtered to that category.
3. **Given** the Mercado screen, **When** the visitor selects an NFT from the trending rail or a collection from the collections rail, **Then** they reach the corresponding NFT detail or a pre-filtered catalog view.

---

### User Story 2 - Browse creators and their work (Priority: P2)

A visitor taps "Criadores" and sees a directory of the marketplace's creators; selecting one shows that creator's profile (bio) and every NFT they've listed.

**Why this priority**: Creator discovery is a common secondary marketplace journey (compared to "Mercado"'s primary browse/search role) and depends only on data the catalog already has (each NFT already names its creator), so it's the next most valuable, least risky addition.

**Independent Test**: Load the creators directory on its own, confirm a grid of creators renders with name/avatar/NFT count, select one, and confirm the creator's detail screen shows a bio and the correct set of their NFTs.

**Acceptance Scenarios**:

1. **Given** a visitor on any screen, **When** they select "Criadores" from the navigation, **Then** they reach a directory listing every creator with at least one listed NFT, showing each creator's avatar, name and number of NFTs.
2. **Given** the creators directory, **When** the visitor selects a creator, **Then** they reach that creator's detail screen showing a short bio and a grid of all their listed NFTs.
3. **Given** a creator detail URL for a creator id that does not exist, **When** the visitor loads it, **Then** the screen shows a clear not-found state instead of an error or a blank page.

---

### User Story 3 - Learn about NFTs (Priority: P3)

A visitor taps "Aprenda" and finds a short list of educational articles about NFTs and the marketplace; selecting one opens the full article.

**Why this priority**: Lowest direct commercial value of the three (it doesn't drive a purchase path), but it's the simplest to deliver (static editorial content, no live data) and closes out the last disabled nav link.

**Independent Test**: Load the learn list on its own, confirm articles render with title and summary, select one, and confirm the full article opens with its own content.

**Acceptance Scenarios**:

1. **Given** a visitor on any screen, **When** they select "Aprenda" from the navigation, **Then** they reach a list of educational articles, each showing a title, short summary and estimated reading time.
2. **Given** the learn list, **When** the visitor selects an article, **Then** they reach that article's full content.
3. **Given** a learn-article URL for a slug that does not exist, **When** the visitor loads it, **Then** the screen shows a clear not-found state instead of an error or a blank page.

---

### Edge Cases

- What happens when a creator has had every one of their NFTs delisted/sold out, so they'd show up with zero active listings? They still appear in the creators directory (so their profile remains reachable), but their NFT count and detail grid reflect zero or remaining items rather than disappearing silently.
- What happens when the Mercado screen's "em alta"/"coleções" source data is temporarily empty (e.g., a newly reset catalog)? Each rail shows an explicit empty state for that rail rather than an error, while the rest of the screen still renders.
- What happens when a visitor reaches any of the three new screens directly (deep link, refresh, shared URL) rather than via navigation? Each screen loads independently and correctly, the same as if reached via the nav link.
- What happens on very small or very large viewports (390px / 1440px, per the project's existing responsive requirement)? All three screens remain fully usable with no horizontal overflow, consistent with every other screen in the product.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a "Mercado" screen, reachable from the navigation, showing NFT categories, a trending selection and a collections grouping, distinct from the home page's general search/filter/browse experience.
- **FR-002**: Selecting a category, a trending item, or a collection on the Mercado screen MUST take the visitor to the corresponding pre-filtered view of the existing catalog, or to the selected NFT's detail screen.
- **FR-003**: The system MUST provide a "Criadores" screen, reachable from the navigation, listing every creator who has at least one listed NFT, showing each creator's avatar, name and NFT count.
- **FR-004**: The system MUST provide a creator detail screen showing a creator's bio and all of their currently listed NFTs, reachable by selecting a creator from the Criadores screen or via a direct link.
- **FR-005**: The system MUST show a not-found state on the creator detail screen when the requested creator does not exist.
- **FR-006**: The system MUST provide an "Aprenda" screen, reachable from the navigation, listing educational articles with a title, summary and estimated reading time.
- **FR-007**: The system MUST provide an article detail view showing an article's full content, reachable by selecting it from the Aprenda screen or via a direct link.
- **FR-008**: The system MUST show a not-found state on the article detail view when the requested article does not exist.
- **FR-009**: The "Mercado", "Criadores" and "Aprenda" navigation links MUST become active (no longer disabled/dead links) once their destination screens exist; the "Favoritos" navigation link remains disabled and is out of scope for this feature.
- **FR-010**: All three new screens MUST be reachable without signing in, matching the home page's public access.
- **FR-011**: All three new screens MUST meet the project's existing responsiveness and accessibility bar (functional at 390/768/1440px with no horizontal overflow, keyboard-operable, accessible labels and focus handling), matching every other screen in the product.

### Key Entities

- **Creator**: A marketplace participant who has listed at least one NFT. Attributes: identity (name, avatar), a short bio, and a derived count of their currently listed NFTs. Already partially represented today as the "artist" named on each NFT; this feature surfaces it as a first-class, independently browsable profile.
- **Learn Article**: A piece of educational content about NFTs/the marketplace. Attributes: title, summary, estimated reading time, full body content. Editorial content, not user- or transaction-generated data.
- No changes to existing NFT, Cart, Order or Wallet concepts are introduced by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 3 previously-disabled navigation links (Mercado, Criadores, Aprenda) lead to a working screen with zero dead/disabled links remaining among them.
- **SC-002**: A visitor can go from the Mercado screen to a filtered catalog view or an NFT's detail in 1 selection.
- **SC-003**: A visitor can go from the Criadores directory to a specific creator's full list of NFTs in 1 selection.
- **SC-004**: A visitor can go from the Aprenda list to an article's full content in 1 selection.
- **SC-005**: All three new screens render with equivalent functionality at both the 1440px desktop and 390px mobile breakpoints, with zero features available on one but missing on the other.
- **SC-006**: The complete automated verification suite (lint, typecheck, build, full end-to-end test run) passes with zero regressions introduced by this feature's changes.

## Assumptions

- This feature only builds real destinations for the "Mercado", "Criadores" and "Aprenda" navigation links; it does not touch the "Favoritos" link, which remains a separate, out-of-scope placeholder.
- The Mercado screen is a curated discovery surface, not a second general-purpose catalog — it deliberately does not duplicate the home page's own search/filter/grid/pagination.
- Creators are derived from the NFTs already listed in the catalog (each NFT already names its creator); no separate creator-registration flow or creator-authored content is introduced in this feature.
- Learn articles are static editorial content maintained by the team, not user-generated or user-editable; no article-authoring interface is introduced in this feature.
- Exact visual fidelity to the product's Figma reference design for these three screens could not be confirmed during specification — access to the relevant Figma file was unavailable. The content and interaction structure above is based on first principles and the product's existing design system (reused components, existing responsive/accessibility bar). A follow-up visual-fidelity review against the actual reference design is expected once access is available; this is an accepted risk for this feature, not a blocker to building it.
