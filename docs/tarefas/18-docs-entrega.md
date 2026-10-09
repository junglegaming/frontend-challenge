# 18 — Documentação de entrega (README + ARCHITECTURE)

**Onda:** 10 · **Paralela com:** `17-lighthouse` · **Depende de:** 14 · **Bloqueia:** 19
**Label sugerido:** `docs` · **Esforço:** M

## Objetivo

Fechar a documentação exigida pelo `README.md` §12: README da solução e
completude do `ARCHITECTURE.md`.

## Subtasks

### 18.1 — README.md da solução

- Mover o enunciado (ex.: `docs/DESAFIO.md`) e escrever: setup do zero
  (pré-requisitos, install, dev, build), variáveis de ambiente e credenciais fictícias
  (2 usuários), comandos (dev, build, typecheck, lint, test:contract, test:e2e,
  lighthouse, fig:extract)

### 18.2 — Cenários e fluxos de falha no README

- Seleção e reset de cenários (`?scenario=`, switcher, `?reset=1`)
- Passo a passo para reproduzir cada cenário de falha do catálogo

### 18.3 — Completar `ARCHITECTURE.md`

- §9 (decisões/desvios do Figma — incluir evidências da fase 15) e §10
  (limitações: simulação blockchain, transporte MSW de socket, sessão)
- Atualizar ponteiro do enunciado em `AGENTS.md` se o README mudar de lugar

### 18.4 — Conferência código × docs e checklist §12

- Contratos REST/eventos: se o código final divergiu, atualizar `docs/api/` + `docs/MOCKS.md`
- Checklist §12 do enunciado: fonte, lockfile, assets, mocks, fixtures, testes,
  configs de auditoria presentes no repo

## Critérios de aceite (gate)

- [ ] Checkout limpo + seguir o README reproduz a aplicação e os cenários de falha
- [ ] `pnpm typecheck && pnpm lint` verdes

## Referências

- `README.md` (enunciado) §12 · `ARCHITECTURE.md` · `AGENTS.md` · `docs/MOCKS.md`
