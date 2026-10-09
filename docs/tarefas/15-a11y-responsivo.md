# 15 — Acessibilidade + responsividade (390/768/1440)

**Onda:** 8 · **Paralela com:** `14-tempo-real` · **Depende de:** 12, 13 · **Bloqueia:** 17
**Label sugerido:** `ui` · **Esforço:** M

## Objetivo

Auditoria e correção transversal de a11y e breakpoints em todas as 9 telas
(exigências do `README.md` §8).

## Subtasks

### 15.1 — Teclado e foco

- Navegação completa por teclado (grid, filtros, formulários, checkout) + foco
  visível sempre (outline primary 2px, nunca `outline: none` sem substituto)

### 15.2 — Diálogos e drawers

- Foco controlado em `Dialog`/`Sheet` (trap + retorno ao gatilho ao fechar)

### 15.3 — Semântica e formulários

- Landmarks, headings hierárquicos, labels associados, erros com
  `aria-describedby`/`aria-invalid`, feedback de mutations com `aria-live`

### 15.4 — Imagens, ícones e cor

- `alt` nas imagens relevantes; ícones decorativos `aria-hidden`
- Estados não dependentes só de cor (ícone + texto) · contraste AA nos pares usados

### 15.5 — Breakpoints e zoom

- 390 (mín. exigido), 414 (frames), 768, 1440 — sem overflow horizontal ·
  zoom 200% sem perda de conteúdo

### 15.6 — Movimento reduzido

- `prefers-reduced-motion` desliga shimmer/animações (bloco estático)

## Critérios de aceite (gate)

- [ ] Checklist §8 do enunciado 100% coberto (registrar evidência no `ARCHITECTURE.md` §9)
- [ ] `pnpm lint` verdes · passada manual por teclado em todas as telas

## Referências

- `README.md` (enunciado) §8 · `docs/ESTILOS.md` §5–6 · `AGENTS.md` §9
