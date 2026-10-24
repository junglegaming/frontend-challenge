# Implementation Plan: Telas do Marketplace de NFTs (Mobile + Desktop)

**Branch**: `002-nft-marketplace-screens` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-nft-marketplace-screens/spec.md`

## Summary

Implementar as 6 telas ainda não construídas do marketplace Kurio — Início (catálogo), diálogo de
autenticação (Login/Cadastro), Carrinho, Pagamento (checkout), Confirmação de pedido e Carteiras —
com paridade funcional completa entre os breakpoints desktop (1440 px) e mobile (390 px) dos designs
de referência. As pastas de página e domínio já existem como esqueletos (`src/pages/*`,
`src/domains/*`) com README e contratos parcialmente definidos; o trabalho é majoritariamente
front-end: montar UI com `src/shared/ui` (shadcn/ui) sobre os contratos Axios/TanStack Query já
simulados em `src/mocks`, seguindo os tokens e layout definidos em `specs/001-design-system-standards`.

## Technical Context

**Language/Version**: TypeScript ~6.0 (React 19.2)

**Primary Dependencies**: TanStack Router 1.170 (rotas + estado de busca na URL), TanStack Query 5.104
(estado remoto), Axios 1.20 (cliente HTTP), react-hook-form 7.89 + @hookform/resolvers + Zod 4.6
(formulários e validação na borda), decimal.js (valores em ETH), socket.io-client 4.8 (tempo real),
shadcn/ui (radix-ui, cva, tailwind-merge) + Tailwind CSS 4.3, lucide-react (ícones), sonner (toasts)

**Storage**: N/A (estado remoto simulado via MSW; sem storage próprio do browser além de sessão/token)

**Testing**: Playwright (E2E + regressão visual em 390/768/1440, uma pasta por página em `e2e/`),
oxlint (incluindo `jsx-a11y` e regras de fronteira), `pnpm typecheck`, Lighthouse (`pnpm lighthouse`)

**Target Platform**: Web (desktop, tablet, mobile), tema escuro único (tokens de
`specs/001-design-system-standards`)

**Project Type**: web-application (SPA front-end; mocks via MSW simulando REST + Socket.IO)

**Performance Goals**: totais de carrinho/checkout recalculam em <1s após qualquer mudança (SC-005);
sem layout shift perceptível ao trocar de breakpoint; Lighthouse acessibilidade ≥ 95 (herdado de 001)

**Constraints**: Princípio VI (acessibilidade/responsividade/fidelidade visual) é NON-NEGOTIABLE —
390/768/1440 px sem overflow horizontal, foco visível, labels/erros associados, skeletons com
shimmer; checkout/carteiras/pedidos exigem autenticação; sem integrações reais de blockchain,
carteira ou gateway de pagamento (simulado via `src/mocks`); recibos são snapshot imutável do
pedido; regras de fronteira de `docs/TEAMS.md` verificadas por `pnpm lint`

**Scale/Scope**: 6 páginas novas de UI (home, login, signup, cart, checkout, order-confirmation,
wallets — 7 pastas já esqueletadas, Detalhes do NFT e Perfil já implementados), ~6 novas rotas
TanStack Router, 1 componente de diálogo de autenticação compartilhado, extensões pontuais aos
domínios `auth`, `cart`, `checkout`, `orders`, `wallets`, `catalog`

## Constitution Check

*GATE: passou antes da Fase 0; reavaliado após a Fase 1 — ver notas abaixo.*

| Princípio | Avaliação |
|-----------|-----------|
| I. Camadas e fronteiras | OK. UI de página em `pages/<página>`; lógica/contratos compartilhados por mais de uma página (ex.: diálogo de autenticação usado por `login` e `signup`) sobe para `domains/auth/components`. Páginas só importam domínios pela API pública. |
| II. Tipagem estrita | OK. Reaproveita os contratos já tipados em `domains/*/model/contracts.ts` (sem `any`); novas entradas de formulário validadas com Zod na borda. |
| III. Estado remoto | OK. Toda leitura/mutação via Axios + TanStack Query, query keys por usuário/parâmetros; busca/filtro/ordenação/paginação do catálogo na URL; cupom e submissão de pedido usam idempotência; stepper de quantidade do carrinho é a interação com atualização otimista + rollback exigida pelo Princípio III. |
| IV. Tempo real | OK. Catálogo consome `nft.updated` (hook já existe: `use-catalog-realtime-sync`); confirmação de pedido consome `order.updated`; reconciliação via REST após reconexão já é padrão do domínio. |
| V. Mocks só em `src/mocks` | OK. Nenhum dado fictício novo em componentes/hooks; página de checkout/carteiras usa só os campos já modelados pelos contratos existentes (ver `research.md` D2/D3 para o mapeamento com os designs). |
| VI. Acessibilidade/responsividade/fidelidade | É o alvo principal junto com V. Reaproveita tokens/`PageContainer`/`Navbar`/`Dock` de 001; exige componentes shadcn adicionais (ver `research.md` D6). |
| VII. Testes e auditoria | A cumprir na implementação: pasta `e2e/<página>` por tela nova, cenários de falha (rede, cupom inválido, preço alterado, timeout idempotente, sessão expirada) e regressão visual 390/768/1440. |

Sem violações que exijam a seção de Complexidade.

## Project Structure

### Documentation (this feature)

```text
specs/002-nft-marketplace-screens/
├── plan.md               # este arquivo
├── research.md           # Fase 0
├── data-model.md         # Fase 1
├── quickstart.md         # Fase 1
├── contracts/
│   ├── catalog-home.md
│   ├── auth-dialog.md
│   ├── cart.md
│   ├── checkout.md
│   ├── order-confirmation.md
│   └── wallets.md
├── checklists/requirements.md
└── tasks.md               # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/routes/
│   ├── index.tsx                 # troca o placeholder atual pela HomePage (catálogo)
│   ├── login.tsx                 # novo — AuthDialogPage com aba "Entrar" ativa
│   ├── signup.tsx                 # novo — AuthDialogPage com aba "Criar conta" ativa
│   ├── cart.tsx                   # novo
│   ├── checkout.tsx               # novo (protegida)
│   ├── orders.$orderId.tsx        # novo (protegida)
│   └── account.wallets.tsx        # novo (protegida) — mesmo padrão de account.profile.tsx
├── pages/
│   ├── home/                      # preenche o esqueleto: HomePage, components/ (Hero, Filters, NftGrid, SortBar)
│   ├── login/ signup/             # preenchem o esqueleto reaproveitando domains/auth/components/AuthDialog
│   ├── cart/                      # CartPage, components/ (CartLineList, CartSummary)
│   ├── checkout/                  # CheckoutPage, components/ (CollectorForm, WalletPicker, OrderSummary)
│   ├── order-confirmation/        # OrderConfirmationPage, components/ (Receipt, PendingState, DeclinedState)
│   └── wallets/                   # WalletsPage, components/ (WalletForm), reaproveita ProfileSidebar
├── domains/
│   ├── auth/                      # completa api/ hooks/ e adiciona components/AuthDialog.tsx (usado por login e signup)
│   ├── cart/                      # adiciona hooks de quote/coupon/update-item (otimista) além dos já existentes
│   ├── catalog/                   # adiciona hooks de filtro/paginação consumidos pela home
│   ├── checkout/                  # preenche model/ (chave de idempotência) + api/hooks de criação de pedido
│   ├── orders/                    # adiciona api/hooks (get order, order.updated)
│   └── wallets/                   # adiciona api/hooks (list/create/update)
└── shared/ui/                     # novos componentes shadcn/ui necessários (ver research.md D6): sheet, slider,
                                    # radio-group, textarea — adicionados via CLI oficial, tema herdado de 001
e2e/
├── home/ auth/ cart/ checkout/ order-confirmation/ wallets/   # uma pasta por página nova, 390/768/1440 + a11y
```

**Structure Decision**: mantém a arquitetura em camadas já estabelecida
(`app/routes → pages → domains → shared`, `docs/TEAMS.md`). Nenhuma pasta nova de página ou domínio
é criada — todas as 6 telas já têm pasta esqueleto; o trabalho preenche esses esqueletos e as rotas
finas correspondentes. O único componente novo compartilhado entre páginas (`AuthDialog`) fica em
`domains/auth/components`, não em `shared/ui`, porque carrega lógica de negócio (login/signup) e é
usado por exatamente duas páginas do mesmo domínio.

## Complexity Tracking

Sem violações da constituição; nada a justificar.
