# 17 — Auditoria Lighthouse (mobile/desktop)

**Onda:** 10 · **Paralela com:** `18-docs-entrega` · **Depende de:** 15 · **Bloqueia:** 19
**Label sugerido:** `performance` · **Esforço:** S

## Objetivo

Auditar início e detalhe do NFT com build otimizado e cenário padrão dos mocks,
registrando mediana de 3 medições por página/perfil.

## Subtasks

### 17.1 — Configuração versionada

- Config em `audits/` com perfis mobile e desktop, cenário `padrao`,
  fonts/assets locais, sem simplificação de escopo

### 17.2 — Script `pnpm lighthouse`

- 3 medições × 2 páginas × 2 perfis → mediana por categoria

### 17.3 — Análise e justificativas

- Metas: Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90
- Capturar LCP, CLS e TBT; justificar resultados abaixo da meta com causa raiz

### 17.4 — Relatórios

- Versionar HTML/JSON + versões das ferramentas + condições de execução

## Critérios de aceite (gate)

- [ ] Metas atingidas **ou** justificativas documentadas com evidência
- [ ] Relatórios em `audits/reports/` versionados

## Referências

- `README.md` (enunciado) §10 · `PLANO.md` Fase 13
