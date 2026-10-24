# Implementation Plan: Ambiente de produção do front-end

**Branch**: `008-web-production-env` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-web-production-env/spec.md`

## Summary

Publica o `apps/web` na Vercel como um projeto próprio e torna o build de produção **correto por
omissão**. Três problemas reais do código atual determinam o desenho: (1) o MSW, ligado em produção
porque o produto é um demo, também interceptaria `/backend/*` e a API real nunca seria chamada;
(2) o domínio `coins` aponta para `http://localhost:4000` por padrão, então o navegador do visitante
chamaria a própria máquina; (3) falta declarar roteamento, cache e cabeçalhos de entrega. A solução:
uma flag própria para o mock do `/backend` (desligada por padrão em builds de produção), moedas
desativadas quando não há URL configurada, um `vercel.json` com rewrite `/backend/*` → API, fallback da
SPA, cache e cabeçalhos de segurança, mais uma matriz de variáveis documentada e um config Playwright separada
`playwright.production.config.ts` que prova o comportamento de produção sem tocar na suíte atual. Nenhuma mudança em
`apps/api` nem em `server/`.

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19.2, Vite 8 (inalterados); Node 22.

**Primary Dependencies**: nenhuma nova. Usa o que já existe: `vercel` CLI (devDependency da raiz),
Playwright, Lighthouse.

**Storage**: N/A (feature de configuração; não persiste dados).

**Testing**: suíte Playwright existente **inalterada** (modo `dev`); novo config Playwright separada
`playwright.production.config.ts` (serve `vite build` + `vite preview` com as variáveis de produção); verificações
`curl` de entrega no preview; `pnpm lighthouse` contra o build publicado.

**Target Platform**: Vercel — projeto estático (preset `vite`) com rewrites e cabeçalhos; navegadores
modernos.

**Project Type**: web-application no monorepo pnpm+Nx já existente (alvo: `apps/web`).

**Performance Goals**: nenhuma meta nova além de registrar o resultado do Lighthouse (SC-005); cache
imutável de assets é o ganho de desempenho concreto.

**Constraints**: `apps/api`, `server/` e as specs 006/007 MUST NOT ser alterados; desenvolvimento e e2e
atuais MUST manter o comportamento (FR-009); nenhum `localhost` em código de aplicação do build de
produção (FR-007); US2 depende de a API de produção responder (FR-013).

**Scale/Scope**: 1 projeto Vercel novo, ~6 arquivos de código alterados em `apps/web`
(`env.ts`, `vite-env.d.ts`, `mocks/composition.ts`, `domains/coins`, 2 componentes de moedas),
1 `vercel.json` ampliado, 1 projeto Playwright novo, documentação.

## Constitution Check

*GATE: avaliado antes da Fase 0 e reavaliado após a Fase 1 — resultado igual nas duas passagens. Base:
constituição v1.3.0 (inclui a exceção do monorepo da 007).*

| Princípio | Avaliação |
|-----------|-----------|
| I. Camadas e fronteiras | OK. As páginas de moedas passam a ler `coinsEnabled` pela **API pública** do domínio (`@/domains/coins`); nenhuma página importa outra, e `shared/` (onde fica `env.ts`) não importa domínios. |
| II. Tipagem estrita | OK. `coinsApiUrl` vira `string \| undefined` (tipado, sem `any`); variáveis novas declaradas em `vite-env.d.ts`. Valores de ambiente são dados externos: só `'true'` liga uma flag. |
| III. Estado remoto | OK. Moedas desativadas não geram consulta (`enabled` falso), sem mudar a política de cache/retry existente. Nenhum cliente HTTP novo. |
| IV. Tempo real | N/A. `VITE_SOCKET_URL` continua apontando para um endpoint **simulado** pelo MSW; não muda. |
| V. Mocks só em `src/mocks` | OK. A produção mantém o MSW para `/api/*` (o produto é demo por constituição); a flag nova só decide **se os handlers do `ledger` são registrados**, dentro de `src/mocks`. Nenhum dado fictício entra em componentes ou clientes. |
| VI. Acessibilidade/responsividade/fidelidade | OK. Ocultar a seção de moedas só ocorre em build de produção; os breakpoints e a identidade visual das demais telas não mudam. |
| VII. Testes e auditoria | OK, com ressalva. A suíte atual roda em `dev` e **não** prova comportamento de produção, por isso o config `playwright.production.config.ts` (D10). `pnpm lighthouse` roda contra o build publicado. Os 6 snapshots de `checkout`/`wallets` já desatualizados (007) seguem fora do escopo. |
| Exceção 007: "`apps/web` movida sem mudança de comportamento" | Compatível: a frase descreve a **relocação**, já concluída. Esta feature muda comportamento apenas em **builds de produção** (moedas ocultas, mock de backend desligado) e preserva o de desenvolvimento. Não exige emenda. |
| Fluxo: estrutura/comportamento visível | Atualizar `docs/TEAMS.md`, `apps/web/.env.example` e o README do domínio `coins`; teste e2e cobre a mudança visível (config `playwright.production.config.ts`). |

Sem violações. Complexity Tracking não tem linhas.

## Project Structure

### Documentation (this feature)

```text
specs/008-web-production-env/
├── plan.md                     # este arquivo
├── research.md                 # Fase 0 — decisões D1-D11
├── data-model.md               # Fase 1 — matriz de configuração por ambiente
├── quickstart.md               # Fase 1 — publicar e validar (preview → produção)
├── deploy-environments.md      # Fase 1 — ambientes de deploy por projeto (web, api, server) e variáveis
├── contracts/
│   └── delivery-rules.md       # Fase 1 — rewrites, cache e cabeçalhos de apps/web/vercel.json
└── tasks.md                    # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
apps/web/
├── vercel.json                          # ampliado: rewrite /backend, fallback sem /assets, cache, cabeçalhos
├── vite.config.ts                       # (sem mudança; proxy /backend já existe para dev/preview)
├── .env.example                         # + VITE_ENABLE_BACKEND_MOCKS; VITE_COINS_API_URL comentada
├── .env.production                      # novo: valores públicos do build de produção (sem segredos)
├── playwright.config.ts                 # + config `playwright.production.config.ts` (webServer: build + vite preview)
├── e2e/
│   └── production/
│       └── storefront/backend/hardening.spec.ts  # novos: rotas, /backend real, moedas ocultas, 0 req. a localhost, 0 violações de CSP
└── src/
    ├── vite-env.d.ts                    # + VITE_ENABLE_BACKEND_MOCKS
    ├── shared/config/env.ts             # + enableBackendMocks, coinsApiUrl opcional, coinsEnabled
    ├── mocks/composition.ts             # ledgerHandlers só quando env.enableBackendMocks
    ├── domains/coins/
    │   ├── api/queries.ts               # useCoinsBalance/useTopUpCoins: desativados sem coinsEnabled
    │   ├── index.ts                     # exporta coinsEnabled
    │   └── README.md                    # documenta a desativação em produção
    └── pages/
        ├── wallets/components/CoinsBalanceSection.tsx   # não renderiza sem coinsEnabled
        └── checkout/components/PaymentMethodPicker.tsx  # sem a opção "moedas" sem coinsEnabled

docs/TEAMS.md                            # registra o ambiente de produção e a matriz de variáveis
```

**Structure Decision**: toda a mudança fica em `apps/web` e na sua configuração de entrega; o projeto
Vercel novo é independente do da API (D1). A decisão de moedas é tomada **uma vez**, em `env.ts`
(`coinsEnabled`), e consumida pelas duas telas por meio da API pública do domínio, em vez de cada tela
inspecionar variáveis de ambiente. O teste de produção é um projeto Playwright separado (D10) para não
alterar a premissa da suíte atual.

## Complexity Tracking

Sem violações da constituição a justificar.

## Riscos e dependências

| Risco | Efeito | Tratamento |
|---|---|---|
| API de produção responde `404` (defeito da 007, T022/T023) | US2 e SC-002 não podem ser concluídos | FR-013: dependência explícita; US1/US3 independem dela; hipótese de causa em research D11 |
| CSP bloquear algo em silêncio | Site quebra só em produção | Smoke falha em violação de CSP; relaxar a diretiva, não remover a política (D7) |
| Monorepo pnpm com *Root Directory* na Vercel | Build do preview falha | Verificado no primeiro preview; fallback `installCommand` (D1) |
| Destino do rewrite fixo | Troca de domínio da API exige republicar | Aceito e documentado (D4) |
| Preview protegido pela Vercel | Validação automatizada precisa de bypass | Segredo de bypass documentado no quickstart (passo 4) |
