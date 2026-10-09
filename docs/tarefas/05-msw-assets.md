# 05 — Bootstrap MSW + extração de assets do Figma

**Onda:** 2 · **Paralela com:** `03-tema-shadcn`, `04-libs-core` · **Depende de:** 02 · **Bloqueia:** 07
**Label sugerido:** `mocks` · **Esforço:** S

## Objetivo

Ligar a camada de mocks ao bootstrap (sem handlers ainda) e extrair todos os assets
visuais do Figma/.fig para uso local.

## Subtasks

### 05.1 — Bootstrap do MSW

- `main.tsx`: import dinâmico do MSW só quando `VITE_MOCKS=true` (antes do render)
- `src/mocks/browser.ts` (worker) e `src/mocks/server.ts` (para Vitest) com
      `onUnhandledRequest` configurado e `handlers` vazio/health-check
- Endpoint mínimo `GET /api/_health` para validar o pipeline de rede

### 05.2 — Script `fig:extract`

- `scripts/figma-extract.ts` (`pnpm fig:extract`, lê `FIGMA_TOKEN`):
  - `GET /v1/files/:key` → JSON de referência em `docs/figma/`
  - `GET /v1/images?ids=…&format=svg` → ícones Iconly em `public/icons/`
  - copiar os 4 PNGs (1254²) do `Frontend Challenge.fig` → `public/assets/nft/`

### 05.3 — Executar e versionar a extração

- Rodar o script e commitar os assets extraídos

## Critérios de aceite (gate)

- [x] `pnpm dev` (VITE_MOCKS=true) consome `/api/_health` via Axios com resposta do MSW
- [x] `pnpm fig:extract` reproduzível (2ª execução idêntica) e assets presentes em `public/`

## Referências

- `docs/ESTRUTURA.md` §2, §7 · `docs/MOCKS.md` §1–2 · `PLANO.md` Fase 1
