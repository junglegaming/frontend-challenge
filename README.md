# Kurio — NFT Marketplace

Marketplace de NFTs em React + TypeScript, desenvolvido como resposta ao desafio descrito em [`docs/CHALLENGE.md`](docs/CHALLENGE.md). Cobre descoberta, compra e conta do colecionador, em desktop e mobile. Todo o backend (REST e Socket.IO) é simulado com MSW; não há blockchain, carteira ou pagamento reais.

## Stack

| Responsabilidade | Tecnologia |
| --- | --- |
| Interface / linguagem | React 19, TypeScript |
| Roteamento | TanStack Router |
| Estado remoto | TanStack Query |
| HTTP / tempo real | Axios (REST), Socket.IO |
| Estilo / componentes | Tailwind CSS 4, shadcn/ui (Radix) |
| Formulários / validação | React Hook Form, Zod |
| Valores em ETH | decimal.js |
| Mocks | MSW (+ `@mswjs/socket.io-binding`) |
| Testes / auditoria | Playwright, axe-core, Lighthouse |
| Build / lint | Vite, oxlint, pnpm |

## Como rodar

Monorepo pnpm + Nx: o frontend fica em `apps/web`, o backend Vercel em `apps/api` (ver
`apps/api/README.md`) e o backend de moedas da 006 continua em `server/`. Detalhes em `docs/TEAMS.md`.

```bash
pnpm install        # uma vez, na raiz — instala todos os projetos
pnpm dev            # web em http://localhost:5173, com MSW ativo no navegador
pnpm dev:all        # web + api (vercel dev) + server/ juntos
```

Scripts da raiz (via Nx, em todos os projetos):

| Script | O que faz |
| --- | --- |
| `pnpm build` | Build de todos os projetos |
| `pnpm typecheck` | Checagem de tipos de todos os projetos |
| `pnpm lint` | oxlint em todos os projetos (no web, inclui as regras de fronteira entre camadas) |
| `pnpm test:e2e` | Testes Playwright do web contra os mocks |

Scripts só do frontend (rodar com `pnpm --dir apps/web <script>`):

| Script | O que faz |
| --- | --- |
| `preview` | Serve o build em `:4173` |
| `check:tokens` | Falha se houver cor/valor avulso fora dos tokens do design system |
| `test:e2e:update` | Atualiza os snapshots do Playwright |
| `lighthouse` | Auditoria de desempenho e acessibilidade |
| `generate:art` | Gera as ilustrações SVG em `public/art` |

## Publicação (Vercel)

O `apps/web` é publicado como projeto Vercel próprio, como um demo com mocks; `/backend/*` chega à API real
(`apps/api`) por rewrite. Procedimento completo, variáveis por ambiente e verificações:
`specs/008-web-production-env/quickstart.md`. Antes de publicar:

```bash
pnpm --dir apps/web check:production-bundle   # nenhum localhost:<porta> no bundle
pnpm --dir apps/web test:e2e:production       # build de produção: moedas ocultas, CSP sem violações, /backend não mockado
```

## Telas

Início (catálogo, busca, filtros, ordenação), detalhe do NFT, carrinho, pagamento, confirmação do pedido, login, cadastro, perfil do colecionador e carteiras, além de 404 e de uma página interna `/design-system` com o catálogo visual de cores, tipografia, ícones e componentes.

## Arquitetura

Fluxo de dependência único, imposto por lint:

```
app/routes → pages → domains → shared
```

```text
src/
├── app/        # roteamento, layout raiz (Navbar, Dock, Footer), providers
├── pages/      # uma pasta por tela, com README (escopo, rota, domínios)
├── domains/    # regras de negócio por domínio: auth, cart, catalog, checkout,
│               # favorites, orders, profile, wallets (api/, hooks/, model/, index.ts público)
├── shared/     # ui (shadcn adaptado ao tema), icons, api (Axios), realtime, utilitários
└── mocks/      # todo o backend simulado (handlers REST, Socket.IO, cenários, fixtures)
e2e/            # testes Playwright, uma pasta por página
specs/          # especificações Spec Kit
```

Regras principais:
- Uma página nunca importa outra; código comum sobe para um domínio ou `shared/ui`.
- Páginas e rotas usam domínios só pela API pública (`@/domains/<domínio>`).
- `shared/` não importa `app/`, `pages/` nem `domains/`.
- Dados fictícios existem **somente** em `src/mocks`.
- Estado remoto fica no TanStack Query; filtros, busca, ordenação e paginação ficam na URL.
- Valores em ETH trafegam como string decimal e são calculados com `decimal.js`.
- Eventos em tempo real (`nft.updated`, `order.updated`) são versionados e reconciliados via REST após reconexão.

Detalhes de times e responsabilidades: [`docs/TEAMS.md`](docs/TEAMS.md).

## Design system

Identidade baseada no tema escuro da marca, com fonte monoespaçada única (Space Mono) e seis cores base:

| Função | Cor |
| --- | --- |
| Fundo | `#140D0A` |
| Superfície | `#241612` |
| Destaque / primária | `#D28A4C` |
| Texto secundário e bordas | `#B39463` |
| Texto principal | `#F5F1EB` |
| Foco e realces | `#CFB28C` |

Tokens ficam em `src/index.css`; componentes em `src/shared/ui`. Em telas pequenas, a navegação principal vai para uma dock fixa inferior. Contratos completos em `specs/001-design-system-standards/contracts/`.

## Publicação

O `apps/web` vai para a Vercel como projeto próprio (demo com mocks; `/backend/*` chega à `apps/api`).
Antes de publicar: `pnpm --dir apps/web test:e2e:production` e `pnpm --dir apps/web check:production-bundle`.
Procedimento completo: [`specs/008-web-production-env/quickstart.md`](specs/008-web-production-env/quickstart.md).

## Desenvolvimento orientado a especificação

O projeto segue o fluxo do GitHub Spec Kit: **constituição → especificação → plano → tarefas → implementação**. A constituição (`.specify/memory/constitution.md`) reúne os princípios inegociáveis; cada feature vive em `specs/<id>/`. O passo a passo está em [`docs/RELATORIO-SPEC-DRIVEN.md`](docs/RELATORIO-SPEC-DRIVEN.md).

## Contribuindo

- Commits pequenos, no padrão `feat(...)`, `fix(...)`, `refactor:`, `chore(...)`, `docs:`.
- Todo PR deve passar em `pnpm lint`, `pnpm typecheck` e `pnpm build`.
- Mudança visual exige atualizar testes E2E e snapshots.
- Mudança de estrutura exige atualizar `docs/TEAMS.md` e o README da página afetada.
