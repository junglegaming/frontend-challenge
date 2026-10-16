# Mapa da implementação

| Requisito                                         | Arquivo principal / evidência                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| React, TypeScript, Tailwind, shadcn/ui            | `src/main.tsx`, `src/styles.css`, `src/components/ui`, `components.json` |
| Rotas, parâmetros e proteção                      | `src/routes/router.tsx`                                                         |
| Catálogo, filtros combinados, detalhe, favoritos  | `src/pages/catalog.tsx`                                                  |
| Carrinho, cupom, cotação, checkout e recibo       | `src/pages/commerce.tsx`                                                 |
| Login, cadastro, perfil, avatar, senha, carteiras | `src/pages/account.tsx`                                                  |
| Axios, Query, cancelamento, invalidação           | `src/api/index.ts` e queries das páginas                                       |
| Cálculos exatos ETH                               | `src/domain.ts`, `src/domain.test.ts`                                    |
| Contratos e banco simulado                        | `src/domain.ts`, `src/constants/mocks/db.ts`                                       |
| REST e cenários MSW                               | `src/constants/mocks/handlers.ts`                                                  |
| Socket.IO real com MSW                            | `src/configs/websocket-realtime.ts`, `src/constants/mocks/realtime.ts`                               |
| Idempotência, snapshot e recuperação              | handler `/orders`, Checkout, OrderPage                                   |
| Diálogos, foco, teclado                           | `src/components/ui/dialog.tsx`, teste de foco                            |
| E2E desktop/mobile                                | `tests/marketplace.spec.ts`                                              |
| Regressão visual                                  | `tests/visual.spec.ts` e baselines                                       |
| Lighthouse e medianas                             | `scripts/audit.mjs`, `reports/lighthouse`                                |
| Deploy SPA                                        | `vercel.json`, `public/_redirects`, `.openai/hosting.json`               |


