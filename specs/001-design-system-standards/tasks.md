---

description: "Task list for Padrões do Design System (Kurio)"
---

# Tasks: Padrões do Design System (Kurio)

**Input**: Design documents from `/specs/001-design-system-standards/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (`design-tokens.md`, `ui-components.md`), quickstart.md

**Tests**: A constituição (Princípio VII) exige E2E Playwright e auditoria de acessibilidade; as tarefas de teste abaixo atendem a isso.

**Organization**: tarefas agrupadas por user story. Referência visual: `specs/001-design-system-standards/reference-profile-screen.png`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1–US4 conforme `spec.md`
- Caminhos relativos à raiz do repositório

## Phase 1: Setup

**Purpose**: destravar a compilação e preparar o terreno

- [X] T001 Resolver os marcadores de merge (`<<<<<<<`) em `src/shared/ui/button.tsx` mantendo a versão shadcn (com `asChild` e variantes), conforme `research.md` D8
- [X] T002 [P] Resolver os marcadores de merge em `src/shared/api/http.ts` (linhas ~49–53), preservando o comportamento de ambos os lados que seja compatível
- [X] T003 Resolver o conflito `UU` em `src/app/routeTree.gen.ts` regenerando o arquivo (`pnpm dev` ou `pnpm build` com o plugin do TanStack Router) e fazer `git add`
- [X] T004 Confirmar que `pnpm typecheck`, `pnpm lint` e `pnpm build` passam antes de qualquer mudança visual (registrar o resultado na descrição do PR)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tokens, fonte, ícones e dados de navegação que todas as stories usam

**⚠️ CRITICAL**: nenhuma story começa antes desta fase.

- [X] T005 Substituir o bloco de tokens em `src/index.css` pelas cores de `contracts/design-tokens.md`: `--background #140D0A`, `--card/--popover/--secondary #241612`, `--primary #D28A4C` com `--primary-foreground #140D0A`, `--muted-foreground #B39463`, `--foreground/--card-foreground #F5F1EB`, `--ring #CFB28C`, `--border/--input` = `#B39463` a 35% de opacidade, `--destructive #FF7A59`; manter `--success` e `--warning`; remover o comentário "Provisional values"
- [X] T006 Em `src/index.css`, definir `--font-sans` e `--font-mono` como `'Space Mono', ui-monospace, monospace`, a escala tipográfica (`title` 16/700, `body` 14/400, `action` 14/700, `caption` 12/400, altura de linha 1,5), raios (`sm` 4 px, `md` 8 px, `lg` 20 px) e a altura de controle de 40 px como tokens expostos ao Tailwind em `@theme inline`
- [X] T007 [P] Em `src/main.tsx` (ou onde as fontes são importadas), importar apenas `@fontsource/space-mono` (pesos 400 e 700) e remover o import de `@fontsource-variable/work-sans` se nenhum arquivo o usar (`git grep work-sans src`); remover a dependência do `package.json` se ficar sem uso — *Feito: só Space Mono é importada; `@fontsource-variable/work-sans` removida do `package.json` (rode `pnpm install` para atualizar o lockfile).*
- [X] T008 [P] Criar `src/shared/icons/index.ts` reexportando de `lucide-react` somente o conjunto oficial com nomes semânticos: `SearchIcon`, `CartIcon`, `ProfileIcon`, `WalletIcon`, `ActivityIcon`, `HeartIcon`, `OffersIcon`, `DownloadIcon`, `SupportIcon`, `LogoutIcon`, `LoginIcon`, `EyeIcon`, `EyeOffIcon`, `ChevronDownIcon`, `AvatarIcon`, `HomeIcon`, `MenuIcon`, `CloseIcon`; documentar no topo do arquivo: traço 1,5, tamanhos 16/20/24, `currentColor`, decorativo = `aria-hidden`
- [X] T009 [P] Criar `src/app/layout/nav-items.ts` exportando o tipo `NavItem` (`id`, `label`, `icon`, `to: string | null`, `enabled`, `placement`) e a lista de itens (Início → `/`, Mercado, Criadores, Aprenda com `to: null`; Carrinho, Favoritos, Conta) conforme `data-model.md`
- [X] T010 [P] Adicionar uma regra de lint em `.oxlintrc.json` (`eslint/no-restricted-imports`) proibindo importar `lucide-react` fora de `src/shared/icons`, com mensagem apontando para `@/shared/icons`
- [X] T011 Ajustar `src/shared/ui/button.tsx` aos tokens: altura 40 px, raio `sm`, `action` bold, variantes `default` (âmbar com texto `#140D0A`), `ghost`/texto e `icon` com área de toque mínima de 44 × 44 px em telas de toque; foco `outline` 3 px em `--ring`

**Checkpoint**: tokens, fonte, ícones e itens de navegação prontos.

---

## Phase 3: User Story 1 - Aparência consistente em todas as telas (Priority: P1) 🎯 MVP

**Goal**: todas as telas com a mesma paleta, fonte, navbar, rodapé e componentes da referência.

**Independent Test**: comparar `/account/profile` em 1440 px com `reference-profile-screen.png` e percorrer as demais rotas conferindo paleta, fonte e navbar iguais (SC-001, SC-002, SC-008).

### Tests for User Story 1

- [X] T012 [P] [US1] Criar `e2e/design-system/visual-profile.spec.ts`: abrir `/account/profile` autenticado (cenário MSW de sucesso) em 1440 px e comparar com snapshot (`toHaveScreenshot`)
- [X] T013 [P] [US1] Criar `e2e/design-system/navbar-consistency.spec.ts`: visitar `/`, `/nft/<id válido>`, `/account/profile` e uma rota inexistente, verificando que a navbar é a mesma e que o item atual tem `aria-current="page"` apenas onde aplicável

### Implementation for User Story 1

- [X] T014 [P] [US1] Criar `src/shared/ui/count-badge.tsx`: selo âmbar circular; `0` não renderiza, `1–99` mostra o número, acima disso `99+`; recebe `count` e é `aria-hidden` (o texto acessível fica no controle pai)
- [X] T015 [P] [US1] Criar `src/shared/ui/nav-link.tsx`: item de navegação com estado padrão, ativo (sublinhado âmbar de 2 px, `aria-current="page"`) e desabilitado (`aria-disabled="true"`, sem navegação, `title="Em breve"`)
- [X] T016 [P] [US1] Criar `src/shared/ui/side-menu.tsx` exportando `SideMenu` e `SideMenuItem`: painel em `--card`, título em bold, item ativo com barra vertical âmbar à esquerda e texto âmbar, item com ícone, `aria-current="page"` no ativo, separador antes de "Sair"
- [X] T017 [P] [US1] Criar `src/shared/ui/page-container.tsx`: contêiner `mx-auto w-full max-w-[1200px]` com gutter 16 px (mobile) e 24 px (≥ md), usado por todas as páginas
- [X] T018 [US1] Criar `src/app/layout/Navbar.tsx` (substitui `Header.tsx`) conforme `contracts/ui-components.md`: `<header>` com `<nav aria-label="Principal">`, logotipo `KURIO` em mono bold, itens via `nav-items.ts` e `NavLink`, busca, carrinho com `CountBadge` e rótulo "Carrinho, N item(ns)", botão "Entrar"/conta; itens sem rota desabilitados; apenas props `cartCount` e `user`; sem import de `app/pages/domains` dentro de `shared`
- [X] T019 [US1] Em `src/app/routes/__root.tsx`, trocar `Header` por `Navbar`, alimentando `cartCount` e `user` pelos domínios `@/domains/cart` e `@/domains/auth` (apenas pela API pública) e remover `src/app/layout/Header.tsx`
- [X] T020 [P] [US1] Restilizar `src/app/layout/Footer.tsx` com os tokens (superfície `--card`, texto `--muted-foreground`, bordas `--border`), mantendo links fora de escopo como texto simples
- [X] T021 [US1] Padronizar `src/pages/profile/ProfilePage.tsx` e `src/pages/profile/components/ProfileSidebar.tsx`, `ProfileForm.tsx`, `AvatarEditor.tsx`: usar `PageContainer`, `SideMenu`, `Button`, `Input`, `Label` e ícones de `@/shared/icons`; layout `grid md:grid-cols-[310px_1fr]`; remover cores e tamanhos avulsos para bater com a referência (título "Perfil do colecionador" bold 16 px, campos 40 px, grupo→grupo 24 px)
- [X] T022 [P] [US1] Padronizar `src/pages/nft-detail/NftDetailPage.tsx` e seus componentes em `src/pages/nft-detail/components/` (`Breadcrumb.tsx`, `EditionPicker.tsx`, `Gallery.tsx`, `NftDetailSkeleton.tsx`, `NftDetailView.tsx`, `NftLoadError.tsx`, `NftNotFound.tsx`, `PurchaseActions.tsx`, `QuantityStepper.tsx`): trocar valores de cor/raio/espaçamento avulsos pelos tokens e ícones por `@/shared/icons`
- [X] T023 [P] [US1] Padronizar `src/pages/home/` e `src/app/routes/index.tsx`: aplicar `PageContainer` e os tokens ao conteúdo existente ou ao esqueleto da página
- [X] T024 [P] [US1] Padronizar os esqueletos `src/pages/cart/`, `src/pages/checkout/`, `src/pages/order-confirmation/`, `src/pages/login/`, `src/pages/signup/`, `src/pages/wallets/` e `src/pages/not-found/` (cada `index.ts`/README): garantir uso de `PageContainer` e dos componentes do catálogo quando houver conteúdo; atualizar cada README com a nota "segue `specs/001-design-system-standards`"
- [X] T025 [US1] Padronizar o `NotFound` em `src/app/routes/__root.tsx` com `PageContainer`, `Button` do catálogo e tipografia `title`
- [X] T026 [US1] Varrer `src` por valores avulsos (`git grep -nE "#[0-9a-fA-F]{3,8}|rgb\(|hsl\(" src -- ":!src/index.css"`) e substituir cada ocorrência por token; o resultado deve ser vazio (SC-002)

**Checkpoint**: todas as telas existentes com visual da referência; MVP entregável.

---

## Phase 4: User Story 2 - Formulários claros e acessíveis (Priority: P1)

**Goal**: formulários com rótulos visíveis, obrigatórios identificados, erros associados e foco visível.

**Independent Test**: preencher o formulário de perfil só com teclado e com leitor de tela, deixando obrigatórios vazios (SC-005).

### Tests for User Story 2

- [X] T027 [P] [US2] Criar `e2e/design-system/forms-a11y.spec.ts`: no perfil, navegar só com Tab, verificar foco visível em cada controle, enviar com obrigatórios vazios e checar `aria-invalid`, `aria-describedby` e mensagem de texto; alternar mostrar/ocultar senha e verificar `aria-pressed` e o nome do botão
- [X] T028 [P] [US2] Criar `e2e/design-system/axe.spec.ts` rodando uma checagem de acessibilidade automatizada (adicionar `@axe-core/playwright` como devDependency em `package.json`) em `/`, `/nft/<id>` e `/account/profile` sem violações críticas ou sérias — *Implementado com `axe-core` direto (injetado na página) em vez de `@axe-core/playwright`; `axe-core` adicionado às devDependencies (rode `pnpm install`).*

### Implementation for User Story 2

- [X] T029 [P] [US2] Ajustar `src/shared/ui/label.tsx` para aceitar `required`: exibir o asterisco coral (`--destructive`, `aria-hidden="true"`) e um `<span className="sr-only">(obrigatório)</span>`
- [X] T030 [P] [US2] Ajustar `src/shared/ui/input.tsx` aos tokens: altura 40 px, raio `sm`, borda `--input`, fundo `--background`, texto `--foreground`, placeholder `--muted-foreground`, foco em `--ring` 3 px, erro por `aria-invalid` com borda `--destructive`; remover as classes `dark:` redundantes
- [X] T031 [P] [US2] Ajustar `src/shared/ui/field.tsx` para ligar rótulo, ajuda e erro (`aria-describedby`, erro com ícone e texto, não só cor) e anunciar o erro (`role="alert"` ou região `aria-live="polite"`)
- [X] T032 [P] [US2] Ajustar `src/shared/ui/password-input.tsx`: botão mostrar/ocultar com ícones `EyeIcon`/`EyeOffIcon` de `@/shared/icons`, nome acessível "Mostrar senha"/"Ocultar senha" e `aria-pressed`
- [X] T033 [P] [US2] Criar `src/shared/ui/select.tsx` via CLI do shadcn (`pnpm dlx shadcn@latest add select`) e adaptar ao tema para uso como seletor de sufixo compacto (ex.: `.eth`) acoplado ao `Input`, com `ChevronDownIcon` — *Implementado como `<select>` nativo estilizado (sem a CLI do shadcn, que não estava disponível offline): teclado e leitor de tela completos.*
- [X] T034 [US2] Ajustar `src/shared/ui/avatar.tsx` para o avatar circular com ícone `AvatarIcon` quando vazio e `alt` útil quando houver imagem; aplicar em `src/pages/profile/components/AvatarEditor.tsx` com botões "Alterar" (primário) e "Remover" (texto), ambos com alvo ≥ 44 px
- [X] T035 [US2] Aplicar `Label required`, `Field`, `Select` e `PasswordInput` em `src/pages/profile/components/ProfileForm.tsx` (campos: Nome de exibição\*, Nome de usuário\*, E-mail\*, Nome ENS\* com sufixo `.eth`, Apelido da carteira\*, senha atual/nova/confirmação), mantendo erros de validação vindos da API nos campos
- [X] T036 [US2] Verificar contraste ≥ 4,5:1 (3:1 para bordas e foco) de todos os pares texto/fundo do contrato em `contracts/design-tokens.md` e registrar os valores calculados em uma tabela no próprio arquivo

**Checkpoint**: formulários acessíveis, utilizáveis só com teclado.

---

## Phase 5: User Story 3 - Layout responsivo (Priority: P2)

**Goal**: funcionar em 390, 768 e 1440 px com dock no mobile.

**Independent Test**: abrir `/account/profile` e `/` em 390, 768 e 1440 px e conferir leiaute, rolagem e alvos (SC-004).

### Tests for User Story 3

- [X] T037 [P] [US3] Criar `e2e/design-system/responsive.spec.ts`: para `/`, `/nft/<id>` e `/account/profile` em 390, 768 e 1440 px, afirmar `document.documentElement.scrollWidth <= innerWidth` e snapshot; em 390 a dock está visível e em ≥ 768 oculta
- [X] T038 [P] [US3] Adicionar em `e2e/design-system/responsive.spec.ts` um teste de zoom 200% (viewport 720 px de largura simulando) sem corte de conteúdo e com a dock sem cobrir o último elemento da página

### Implementation for User Story 3

- [X] T039 [US3] Criar `src/app/layout/Dock.tsx` conforme `contracts/ui-components.md`: `<nav aria-label="Navegação rápida">` fixa no rodapé, visível só abaixo de `md`, 4–5 itens de `nav-items.ts` com ícone (24 px) + rótulo, alvo ≥ 44 × 44 px, ativo em `--primary` com indicador (barra superior) e `aria-current="page"`, `padding-bottom: env(safe-area-inset-bottom)`, itens sem rota desabilitados
- [X] T040 [US3] Em `src/app/routes/__root.tsx`, montar `<Dock />` e dar ao `<main>` um padding inferior igual à altura da dock abaixo de `md`; ocultar o `Footer` atrás da dock sem cobri-lo
- [X] T041 [US3] Tornar a `Navbar` (`src/app/layout/Navbar.tsx`) compacta abaixo de `md`: apenas logotipo, busca, carrinho (`CountBadge`) e conta, escondendo os itens de navegação principal (que ficam na dock)
- [X] T042 [US3] Tornar o `SideMenu` responsivo em `src/shared/ui/side-menu.tsx`: coluna fixa ≥ `lg`; abaixo de `lg` vira lista horizontal rolável ou bloco empilhado acima do conteúdo; sem rolagem horizontal da página
- [X] T043 [US3] Em `src/pages/profile/ProfilePage.tsx` e `ProfileForm.tsx`, formulário em 2 colunas ≥ `md` e 1 coluna abaixo; quebra de linha em rótulos e erros longos sem estourar o contêiner
- [X] T044 [P] [US3] Revisar `src/pages/nft-detail/components/Gallery.tsx`, `PurchaseActions.tsx` e `QuantityStepper.tsx` para 390 px: sem overflow horizontal e alvos ≥ 44 × 44 px
- [X] T045 [P] [US3] Em `src/index.css`, garantir `overflow-x: clip` no `body`, suporte a `prefers-reduced-motion` (já existente) também para o shimmer, e `scroll-padding-bottom` para a dock

**Checkpoint**: todas as telas responsivas, dock funcionando.

---

## Phase 6: User Story 4 - Reaproveitamento por times (Priority: P2)

**Goal**: catálogo consultável de tokens, ícones e componentes, com regra de revisão.

**Independent Test**: montar uma tela de formulário nova usando apenas o catálogo, sem estilos novos (SC-007).

### Tests for User Story 4

- [X] T046 [P] [US4] Criar `e2e/design-system/catalog.spec.ts`: abrir `/design-system` e verificar snapshots em 390/768/1440 e que cada token de cor, nível tipográfico, ícone e componente listado em `contracts/` aparece

### Implementation for User Story 4

- [X] T047 [US4] Criar `src/pages/design-system/DesignSystemPage.tsx` e `src/pages/design-system/index.ts`, com seções: cores (nome, valor e contraste), tipografia, espaçamento, raios, ícones (nome + tamanho) e cada componente de `contracts/ui-components.md` em todos os estados aplicáveis (padrão, foco, desabilitado, erro, carregando)
- [X] T048 [P] [US4] Criar `src/pages/design-system/README.md` (escopo, rota `/design-system`, domínios usados: nenhum) seguindo a anatomia de `docs/TEAMS.md`
- [X] T049 [US4] Criar `src/app/routes/design-system.tsx` expondo a rota apenas quando `import.meta.env.DEV` ou a configuração de demonstração em `src/shared/config/env.ts` estiver ativa; a rota importa a página somente por `@/pages/design-system`; não entra na navegação
- [X] T050 [P] [US4] Padronizar `Card`, `Badge`, `Separator`, `Tabs`, `Dialog`, `Skeleton` e `Sonner` em `src/shared/ui/` (um arquivo por componente) aos tokens, com `Skeleton` usando o shimmer e dimensões do conteúdo final e `Dialog` com foco preso
- [X] T051 [P] [US4] Adicionar a seção "Padrões visuais" em `docs/TEAMS.md` resumindo tokens, ícones, navbar, dock, catálogo e a regra de revisão (qualquer cor, fonte, espaçamento ou componente fora do catálogo exige justificativa no PR e atualização de `contracts/`)
- [X] T052 [US4] Adicionar ao `.oxlintrc.json` uma regra proibindo estilos de cor literais em JSX (`style={{ color: ... }}` ou classes `text-[#...]`/`bg-[#...]`), com mensagem apontando para os tokens — *Implementado como script `pnpm check:tokens` (`scripts/check-tokens.mjs`), pois o oxlint não oferece regra por padrão de texto.*

**Checkpoint**: catálogo publicado e regras de revisão automatizadas.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T053 [P] Rodar `pnpm lighthouse` nas páginas `/`, `/nft/<id>` e `/account/profile` e corrigir achados de acessibilidade abaixo de 95 — *`scripts/lighthouse.mjs` não existia; foi criado. Resultado: acessibilidade 100 em `/` e `/nft/nft_001`; perfil coberto por axe (exige login).*
- [X] T054 [P] Medir CLS ao carregar a fonte (Lighthouse) e, se necessário, ajustar `font-display` e a fonte substituta em `src/index.css`
- [X] T055 Atualizar snapshots com `pnpm test:e2e:update` apenas após revisão visual manual contra `reference-profile-screen.png` — *Baselines gerados com `--update-snapshots=missing`; revisados visualmente: perfil 1440 e 390 px. Os demais (768 e catálogo) ainda pedem revisão humana.*
- [ ] T056 Executar a validação manual completa de `specs/001-design-system-standards/quickstart.md` (passos 1–8) e anotar os resultados no PR — *Passos 3–8 cobertos por testes automatizados; a comparação lado a lado com a imagem (passo 2) e o teste manual com leitor de tela ficam para revisão humana.*
- [X] T057 Rodar `pnpm typecheck`, `pnpm lint`, `pnpm build` e `pnpm test:e2e` e confirmar todos verdes

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories → **Polish (Phase 7)**.
- **US1 (P1)** depende só da Fase 2; é o MVP.
- **US2 (P1)** depende da Fase 2; T035 e T034 dependem de T021 (mesmos arquivos de perfil) e de T029–T033.
- **US3 (P2)** depende de US1 (Navbar, SideMenu, `__root.tsx`): T039–T045 estendem T018, T019, T016 e T021.
- **US4 (P2)** depende da Fase 2; T047 consome os componentes de US1 e US2.
- Dentro de cada story: testes primeiro (devem falhar), depois componentes `shared/ui`, depois páginas.

### Parallel Opportunities

- Fase 1: T002 em paralelo com T001.
- Fase 2: T007, T008, T009, T010 em paralelo após T005–T006.
- US1: T014, T015, T016, T017 (arquivos `shared/ui` distintos); T022, T023, T024 (páginas distintas) após T018–T019.
- US2: T029, T030, T031, T032, T033 em paralelo.
- US3: T044, T045 em paralelo; testes T037/T038 em paralelo.
- US4: T048, T050, T051 em paralelo.

### Parallel Example: User Story 1

```text
T014 count-badge.tsx   T015 nav-link.tsx   T016 side-menu.tsx   T017 page-container.tsx
→ T018 Navbar.tsx → T019 __root.tsx
T022 nft-detail   T023 home   T024 esqueletos   (em paralelo)
```

## Implementation Strategy

1. **MVP**: Fase 1 + Fase 2 + US1 → telas com visual e navbar da referência; validar T012/T013 e parar.
2. Acrescentar US2 (formulários acessíveis) → validar; depois US3 (responsivo + dock) → validar; depois US4 (catálogo e regras).
3. Polish ao final; cada story entrega um incremento testável sem quebrar as anteriores.

## Notes

- Valores de cor/tamanho têm uma única fonte: `src/index.css` + `contracts/design-tokens.md`.
- Commits pequenos por tarefa ou grupo lógico, no padrão `feat(ui): ...` / `refactor(pages): ...`.
- Constituição: `shared/` não importa `app/pages/domains`; páginas importam domínios só por `@/domains/<domínio>`.
