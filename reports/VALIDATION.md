# Validação da entrega

Executada em 15/10/2026.

- TypeScript: passou.
- ESLint: passou sem avisos.
- Vitest: 4 testes passaram.
- Playwright: 30 testes passaram (desktop + mobile), incluindo 8 baselines visuais.
- Responsividade: catálogo e detalhe sem overflow em 390, 768 e 1440 pixels.
- npm audit: zero vulnerabilidades.

## Lighthouse — medianas de 3 execuções

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP (ms) | CLS | TBT (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inicio | mobile | 90 | 100 | 96 | 100 | 3045 | 0.0000 | 80.5 |
| inicio | desktop | 99 | 100 | 96 | 100 | 858 | 0.0001 | 0 |
| detalhe | mobile | 90 | 100 | 96 | 100 | 3051 | 0.0000 | 68 |
| detalhe | desktop | 100 | 100 | 96 | 100 | 716 | 0.0000 | 0 |

Todas as medianas atendem às metas. Uma medição individual do detalhe mobile marcou 89; a mediana foi 90. A margem mobile é pequena e deve ser monitorada em outros ambientes.

Boas práticas 96: a consulta de sessão de visitante retorna 401, registrada pelo navegador como erro de rede. O código não suprime esse comportamento para a auditoria.

Relatórios completos: lighthouse/*.html e *.json; ambiente, versões e séries em lighthouse/summary.json. Relatório E2E: e2e/index.html. Screenshots: screenshots/. Traces são preservados pelo Playwright apenas quando há falhas.
