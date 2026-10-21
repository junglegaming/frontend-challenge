# Quickstart: validar os padrões do Design System

## Pré-requisitos

- Conflitos de merge resolvidos (`button.tsx`, `http.ts`, `routeTree.gen.ts`).
- `pnpm install` executado.

## Verificações automáticas

```powershell
pnpm typecheck
pnpm lint          # inclui regras de fronteira e jsx-a11y
pnpm build
pnpm test:e2e      # snapshots visuais em 390 / 768 / 1440 e checagens de acessibilidade
pnpm lighthouse    # acessibilidade ≥ 95 nas páginas principais
```

## Verificação manual

1. `pnpm dev` e abrir `/design-system`: conferir as 6 cores, escala tipográfica, espaçamentos, ícones e todos os componentes com seus estados. Resultado esperado: valores iguais a `contracts/design-tokens.md`.
2. Abrir `/account/profile` em 1440 px e comparar com `reference-profile-screen.png`. Esperado: SC-001 (mesmas cores, fonte, posição dos elementos).
3. Repetir em 768 e 390 px. Esperado: sem rolagem horizontal; em 390 a navbar fica compacta e a dock aparece, com o item atual destacado.
4. Percorrer todas as rotas existentes (`/`, `/nft/<id>`, `/account/profile`, rota inexistente) e conferir navbar/dock iguais e item atual correto (SC-008).
5. Navegar só com teclado (Tab/Shift+Tab/Enter): foco visível em todos os controles, sem armadilhas; formulário de perfil concluível sem mouse.
6. Ativar "reduzir movimento" no sistema: o shimmer dos skeletons deve parar.
7. Zoom 200%: sem corte de conteúdo.
8. Busca por valores avulsos: `git grep -nE "#[0-9a-fA-F]{3,8}" src --  ":!src/index.css"` deve retornar vazio (SC-002).

Contratos de referência: [design-tokens](./contracts/design-tokens.md), [ui-components](./contracts/ui-components.md), [data-model](./data-model.md).
