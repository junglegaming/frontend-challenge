# CLAUDE.md — Kurio (desafio frontend Jungle Gaming)

Guia de contexto para agentes de IA. **Leia antes de qualquer tarefa.** As
fontes de verdade estão em `docs/` (planejamento) e no design system
(`src/index.css`).

## O projeto

Marketplace de NFTs **"Kurio"** (React + TypeScript). Desafio técnico da Jungle
Gaming. **Não há backend real** — toda a API REST e o Socket.IO são simulados
com MSW no navegador (inclusive no build publicado). Deploy na Vercel (obrigatório).

## Stack obrigatória (use de verdade, não "importe e esqueça")

React 19 · TypeScript (strict) · TanStack Router · TanStack Query · Axios ·
REST · Socket.IO (`socket.io-client`) · Tailwind CSS 4 · shadcn/ui · MSW ·
Playwright · Lighthouse. Extra: zod, react-hook-form, big.js, sonner,
`@axe-core/playwright`, Vitest.

## Regras inegociáveis

- **Fonte de verdade, nunca chute:** cores/espaços/fontes vêm do design system
  em `src/index.css`; contratos vêm de `src/shared/contracts` (zod); regras vêm
  do `README.md` (enunciado).
- **ETH como string decimal**, cálculos com `big.js` (nunca `number`).
- **Dados fictícios só em `src/mocks/`.** Componentes, hooks e Axios NÃO têm
  respostas fake nem caminhos alternativos.
- **Tempo real só via `socket.io-client`** — nunca setters/callbacks/cache.
- **REST só via o cliente Axios central** (`src/shared/api/http-client`), com
  validação zod da resposta e normalização em `ApiError`.
- **Tipagem estrita:** sem `any`, sem `@ts-ignore`, sem `as unknown`.
- **UI em pt-BR.**

## Estilo de código

- Um componente React por arquivo; hooks em arquivos próprios.
- Nomes descritivos (`isMobile`, `cartTotal`), nunca genéricos (`data`, `handle`).
- **Comentários profissionais:** API pública (função/hook/tipo/componente
  compartilhado) leva TSDoc (`@param`, `@returns`, `@example`) conciso. Só
  comente o **porquê** — nunca o "o quê" (o código já diz). Zero comentário que
  repete o código.
- **Sem gambiarra:** proibido `@ts-ignore`, `as any`, `as unknown` sem narrowing,
  `// eslint-disable` sem justificativa, ou workaround "para fazer passar". Se o
  TS reclamar, corrija a tipagem.
- Cores/espacamento via classes do tema (`bg-primary`, `text-ink`), nunca hex solto.
- Mobile-first: estilo base mobile, sobrescreve desktop com breakpoints Tailwind.
- Tags semânticas (`button`, `a`, `input`, `label`, `h1–h3`, `nav`, `main`…).

## Commits (só sob autorização humana)

- Conventional Commits: **prefixo inglês + subject pt-BR, sem emoji**, ≤72 chars.
- 1 commit = 1 decisão coerente. Nunca commite sem revisão do diff.
- Husky + commitlint + lint-staged rodam no commit.

## Como trabalhar

1. Consulte `docs/03-PLANO-IMPLEMENTACAO.md` para a fase atual e siga o roadmap.
2. Consulte `docs/07-DESIGN-SYSTEM.md` para fidelidade visual.
3. Rode `npm run typecheck` e `npm run lint` antes de considerar algo pronto.
4. Registre decisões em `docs/` e, ao final, em `DECISOES.md`.

## Comandos

`npm run dev` · `build` · `preview` · `typecheck` · `lint` · `format:check` ·
`test:unit` · `test:e2e` · `lighthouse`.
