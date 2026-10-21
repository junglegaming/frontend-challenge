# Relatório: como o projeto foi estruturado com Spec-Driven Development

Projeto: **Kurio — NFT Marketplace** (React + TypeScript + TanStack Router/Query + Tailwind + shadcn/ui + MSW + Playwright).
Ferramenta: **GitHub Spec Kit** (skills `speckit-*` em `.claude/skills/`, templates e scripts em `.specify/`).
Data: 14/10/2026.

## 1. A ideia: a especificação manda, o código obedece

No Spec-Driven Development a ordem é inversa à do "codar e documentar depois": primeiro se descreve **o quê e por quê**, depois **como**, depois **em que passos**, e só então se implementa. Cada etapa gera um artefato versionado no repositório, e a etapa seguinte só usa o que a anterior produziu.

```
Constituição → Especificação → Clarificação → Plano → Tarefas → Análise → Implementação → Verificação
```

## 2. Estrutura de artefatos no repositório

| Local | Conteúdo |
|---|---|
| `.specify/memory/constitution.md` | Princípios inegociáveis do projeto (v1.0.0) |
| `.specify/templates/`, `.specify/scripts/` | Templates e scripts do Spec Kit |
| `.claude/skills/speckit-*` | Comandos usados no fluxo (specify, clarify, plan, tasks, analyze, implement…) |
| `.specify/feature.json` | Aponta a feature ativa (`specs/001-design-system-standards`) |
| `specs/001-design-system-standards/spec.md` | O quê/por quê: histórias, requisitos, critérios de sucesso |
| `.../plan.md`, `research.md`, `data-model.md` | Como: decisões técnicas, entidades, estrutura |
| `.../contracts/` | Contratos de tokens (`design-tokens.md`) e de componentes (`ui-components.md`) |
| `.../checklists/requirements.md` | Checklist de qualidade da especificação |
| `.../tasks.md` | Tarefas ordenadas por dependência (56 concluídas, 1 pendente no momento do relatório) |
| `.../reference-profile-screen.png` | Fonte de verdade visual |

## 3. Passo a passo

### Passo 0 — Base do projeto (antes do Spec Kit)
Commits `d5c494d`, `2b9e46b`, `6ebd4c8`, `c373497`: scaffold DDD com a stack obrigatória, regra de lint proibindo `any`, uma pasta por página (`src/pages/<página>`) com domínios compartilhados em `src/domains`, e mocks de REST + Socket.IO via MSW. As regras de dependência (`app/routes → pages → domains → shared`) estão em `docs/TEAMS.md` e são impostas pelo `.oxlintrc.json`. Essa base virou a matéria-prima da constituição.

### Passo 1 — Constituição (`/speckit-constitution`)
Foram codificados 7 princípios, a maioria com MUST/MUST NOT verificáveis:
1. Arquitetura em camadas e fronteiras de dependência (inegociável)
2. Tipagem estrita e contratos explícitos (Zod, `decimal.js`, sem `any`)
3. Estado remoto disciplinado (TanStack Query, filtros na URL, idempotência, otimismo com rollback)
4. Tempo real confiável (eventos versionados, reconciliação após reconexão)
5. Mocks apenas na camada de rede (`src/mocks`)
6. Acessibilidade, responsividade e fidelidade visual (inegociável; 390/768/1440 px; shadcn via CLI)
7. Verificação por testes e auditoria (Playwright, Lighthouse, lint/typecheck/build)

Também define restrições (stack, escopo, segurança) e o fluxo: *especificação → plano → tarefas → implementação*. Tudo o que vem depois é checado contra esse documento.

### Passo 2 — Especificação (`/speckit-specify`)
Entrada em linguagem natural: *"Defina os padrões de acordo com a imagem, acessibilidade, espaçamento, responsividade e cores. Crie padrões de reaproveitamento…"*. A imagem de referência (tela de perfil, 1440 px, tema escuro) foi anexada à feature e analisada para extrair cores, tipografia, componentes e espaçamento.

Resultado em `spec.md`:
- **4 histórias de usuário priorizadas** (P1: aparência consistente e formulários acessíveis; P2: responsividade e reaproveitamento), cada uma com teste independente e cenários Given/When/Then.
- **27 requisitos funcionais** (FR-001…FR-027) agrupados em cores, tipografia, espaçamento, responsividade, acessibilidade e componentes.
- **8 critérios de sucesso mensuráveis** (SC-001…SC-008), p. ex. contraste ≥ 4,5:1 e zero valores avulsos.
- Casos de borda (texto longo em 390 px, fonte carregando, movimento reduzido, contador 99+).
- A spec descreve comportamento, sem prescrever tecnologia.

### Passo 3 — Clarificação (`/speckit-clarify`)
Perguntas pontuais, com respostas gravadas na própria spec (seção *Clarifications*):
- A feature só define ou também **aplica** os padrões? → aplica a **todas** as telas.
- Paleta oficial fixada pelo usuário em 6 cores: `#140D0A`, `#241612`, `#D28A4C`, `#B39463`, `#F5F1EB`, `#CFB28C`.
- Inclusão de conjunto de ícones, **navbar** e **dock** (barra inferior para telas pequenas), adicionados como FR-024 a FR-027.

### Passo 4 — Checklist de qualidade (`/speckit-checklist`)
`checklists/requirements.md` valida que a spec é completa, testável e sem detalhes de implementação antes de seguir.

### Passo 5 — Plano (`/speckit-plan`)
Gera o plano e os artefatos de design:
- `plan.md`: contexto técnico, **Constitution Check** (cada princípio avaliado: OK/N/A), estrutura de pastas e decisão de arquitetura (tokens e UI em `shared/`, navbar e dock em `app/layout`, catálogo em `pages/design-system` para não quebrar as regras de dependência).
- `research.md`: decisões D1–D9, cada uma com *Decision / Rationale / Alternatives* (papel de cada cor com contrastes calculados; Space Mono como fonte única; escalas de tipografia, espaçamento e raio medidas da imagem; Lucide como família de ícones; navbar; dock; aplicação às telas; resolução de conflitos de merge pré-existentes; página de catálogo em vez de Storybook).
- `data-model.md`: entidades (token de cor, nível tipográfico, ponto de quebra, ícone, componente).
- `contracts/`: contratos normativos de tokens e de componentes, usados como referência de revisão (FR-023).
- `quickstart.md`: como validar a feature manualmente.

### Passo 6 — Tarefas (`/speckit-tasks`)
`tasks.md` converte o plano em passos executáveis, organizados em fases:
1. **Setup** (resolver marcadores de merge em `button.tsx`, `http.ts`, `routeTree.gen.ts`)
2. **Foundational** (tokens em `src/index.css`, fonte, ícones, `nav-items.ts`), bloqueia o restante
3. **US1** — aparência consistente (MVP)
4. **US2** — formulários acessíveis
5. **US3** — responsividade e dock
6. **US4** — catálogo e regras de revisão automatizadas
7. **Polish** — e2e, Lighthouse, documentação

Cada tarefa tem ID, marcador `[P]` quando paralelizável, rótulo da história e caminho do arquivo. Cada fase termina em um *checkpoint* testável de forma independente.

### Passo 7 — Análise (`/speckit-analyze`, `/speckit-converge`)
Verificação de consistência entre `spec.md`, `plan.md` e `tasks.md` (cobertura de requisitos por tarefa, conflitos com a constituição). O `converge` compara o código real com os artefatos e acrescenta como novas tarefas o que ainda falta construir.

### Passo 8 — Implementação (`/speckit-implement`)
Execução do `tasks.md` em ordem, marcando `[X]`:
- Tokens de cor, tipografia, espaçamento e raio em `src/index.css`, expostos ao Tailwind.
- Componentes de `src/shared/ui` (shadcn via CLI, adaptados pelo tema): button, input, label, field, password-input, select (sufixo), avatar, badge, card, skeleton, dialog, tabs, sonner, separator, e os próprios do projeto (side-menu, nav-link, count-badge, page-container).
- Ícones centralizados em `src/shared/icons`.
- `Navbar`, `Dock`, `Footer` e `nav-items.ts` em `src/app/layout`, montados em `__root.tsx`.
- Migração de todas as páginas (início, detalhe do NFT, perfil etc.) para os padrões.
- Página `/design-system` como catálogo visual.
- Páginas e domínios novos já guiados pela mesma arquitetura: `nft-detail`, e domínios `cart`, `catalog`, `favorites` com `api/`, `hooks/` e `index.ts` públicos.

### Passo 9 — Verificação
- `e2e/design-system/`: catálogo com snapshots em 390/768/1440, acessibilidade de formulários e consistência da navbar.
- `scripts/check-tokens.mjs`: falha se houver cor/valor avulso fora dos tokens (automatiza FR-002/FR-023).
- `scripts/lighthouse.mjs` e `playwright.config.ts` para auditoria de desempenho e acessibilidade.
- `pnpm lint`, `pnpm typecheck` e `pnpm build` como portões obrigatórios (Princípio VII).

## 4. Rastreabilidade (exemplo)

| Origem | Chega até |
|---|---|
| Imagem de referência | cores/tipografia em `spec.md` → decisão D1/D3 em `research.md` → `contracts/design-tokens.md` → tokens em `src/index.css` → `check-tokens.mjs` |
| "Quero uma dock" (clarificação) | FR-026 → decisão D6 → tarefa da fase US3 → `src/app/layout/Dock.tsx` → teste de navbar/dock em `e2e/` |
| Constituição, princípio I | regra em `.oxlintrc.json` → `pnpm lint` bloqueia importação entre páginas |

## 5. Benefícios observados

- **Decisões registradas**: cada escolha tem alternativas descartadas e justificativa (`research.md`).
- **Vários times em paralelo**: fronteiras e contratos evitam divergência (`docs/TEAMS.md`).
- **Qualidade verificável**: critérios mensuráveis viram testes e scripts, não opinião.
- **Retomável**: `feature.json` + `tasks.md` mostram exatamente onde o trabalho parou.

## 6. Estado atual e próximos passos

- Feature `001-design-system-standards`: 56 tarefas concluídas, 1 pendente em `tasks.md`.
- Próximas features sugeridas, cada uma repetindo o ciclo `specify → clarify → plan → tasks → implement`: carrinho/checkout com idempotência, autenticação, carteiras, tempo real do catálogo.
- Ao mudar a estrutura, lembrar de atualizar `docs/TEAMS.md` e o README da página (regra da constituição).
