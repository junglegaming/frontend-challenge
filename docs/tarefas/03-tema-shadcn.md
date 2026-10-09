# 03 — Tema visual: Tailwind v4 + tokens + shadcn/ui

**Onda:** 2 · **Paralela com:** `04-libs-core`, `05-msw-assets` · **Depende de:** 02 · **Bloqueia:** 08
**Label sugerido:** `fase-1-fundacao` · **Esforço:** M

## Objetivo

Materializar `docs/ESTILOS.md` no CSS: cores, tipografia, raios e componentes base —
identidade visual pronta para as telas.

## Subtasks

### 03.1 — Tokens de cor e raios (`@theme`)

- Tailwind CSS v4 com `@theme` em `src/styles/global.css`: 20 tokens de cor
  (`ink`, `surface-*`, `foreground`, `primary*`, `border*`, `coral`, `success`, `error`…)
  e raios (`--radius*`, pill) conforme `docs/ESTILOS.md` §2–3

### 03.2 — Tipografia Roboto Mono

- Escala `text-*` (display → micro) com pesos/line-heights de `docs/ESTILOS.md` §1
- Roboto Mono auto-hospedada (@fontsource 400/500/700) como fonte default

### 03.3 — shadcn/ui adaptado ao tema

- shadcn/ui inicializado (`components.json`) + componentes: button (variantes
  primary/secondary/ghost/danger/pill), input, label, dialog, sheet, select, badge,
  card, skeleton, sonner, tooltip, form — todos lendo os tokens do `@theme`

### 03.4 — Utilitários e estados globais

- Foco visível (`outline` primary 2px), hover/disabled de `docs/ESTILOS.md` §5
- Base do skeleton shimmer com `prefers-reduced-motion`
- Reset base sem overflow horizontal (zoom 200% ok)

## Critérios de aceite (gate)

- [x] Página de teste renderizando cada token/utilitário confere com `docs/ESTILOS.md`
- [x] `pnpm build && pnpm lint` verdes

## Referências

- `docs/ESTILOS.md` (§1–§5) · frames do Figma para conferência
