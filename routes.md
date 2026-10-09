# Camada de rotas

## 1. Escopo

Implementar o mapa de `docs/ESTRUTURA.md` §3 com TanStack Router file-based,
placeholders com h1, frames e links cruzados, sem consultas de dados.
Usar `beforeLoad` nas quatro rotas privadas e validar search params com zod.

## 2. Contratos de URL e demonstração

- Catálogo: `q`, `categories` (array JSON na URL, serialização padrão do router),
  `minPrice`, `maxPrice` como strings ETH, `sort` default `relevance`, `page` default 1.
  Strings vazias são ausentes; alterar filtros reinicia a página em 1.
- Detalhe: `qty` inteiro ≥ 1, default 1.
- Login: `redirect` interno, preservando query/hash; rejeitar `//` e URLs externas.
- Controles de sessão de demonstração são injetados no bootstrap apenas com mocks
  ativos. Fixtures e criação da sessão ficam em `src/mocks/session-controls.ts`.
  Não são autenticação REST: a implementação da conta pertence à etapa posterior.
- O worker inicial contém apenas o reset necessário ao isolamento dos testes;
  handlers de recursos e cenários completos pertencem à task 07.
- Playwright usa POST `/api/_mock/reset` dentro da página (MSW intercepta o browser,
  não `APIRequestContext`) e cenário via `addInitScript` em cada teste.

## 3. Critérios de aceite

- URL direta e refresh nas rotas públicas e privadas autenticadas.
- Privada sem sessão → `/login?redirect=…` → retorno após login de demonstração.
- `/?q=abc&page=2` preserva estado no refresh e histórico.
- `?qty=` preserva quantidade no refresh e histórico.
- Rota desconhecida → 404; guards somente em `beforeLoad`.
- Todas as telas alcançáveis por links; parâmetros inválidos usam o erro da raiz.
- `pnpm typecheck`, `pnpm lint`, `pnpm test:contract`,
  `pnpm test:e2e tests/e2e/routes.spec.ts` e `pnpm build` passam.
