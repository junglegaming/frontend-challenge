# Data Model: Ambiente de produção do front-end

Esta feature não persiste dados. O "modelo" é a **configuração**: quais variáveis existem, em que
ambiente valem o quê e o que cada uma muda no app. Todas as `VITE_*` são embutidas no build (alterar
exige novo deploy). Valores abaixo são o contrato; a leitura tipada vive em `apps/web/src/shared/config/env.ts`.

## Ambiente

| Ambiente | Quem executa | `import.meta.env.DEV` | Origem das variáveis |
|---|---|---|---|
| Desenvolvimento | `pnpm dev` (Vite dev server) | `true` | `apps/web/.env.local` / padrões do `env.ts` |
| Testes e2e atuais | Playwright sobre o dev server | `true` | padrões do `env.ts` (nada definido) |
| Preview | `vercel deploy` | `false` | variáveis do projeto Vercel, escopo *Preview* |
| Produção | `vercel deploy --prod` | `false` | variáveis do projeto Vercel, escopo *Production* |

Preview e Produção usam **o mesmo conjunto** (D8 do research): o preview valida a configuração de produção.

## Matriz de configuração

| Variável | Tipo | Dev / e2e (padrão) | Preview = Produção | Efeito |
|---|---|---|---|---|
| `VITE_ENABLE_MOCKS` | `'true'\|'false'` | `true` | **`true`** (explícito) | Liga o MSW para `/api/*`. Produção segue em demo (constituição, Princípio V). |
| `VITE_ENABLE_BACKEND_MOCKS` | `'true'\|'false'` | `true` (padrão por modo: `DEV`) | **`false`** | Registra ou não os handlers do `ledger` para `/backend/*`. Sem a variável: `true` em dev, `false` em build de produção. |
| `VITE_BACKEND_BASE_URL` | caminho | `/backend` | `/backend` | Prefixo do cliente `ledger`; proxied para `/api/*` da API. |
| `VITE_COINS_API_URL` | URL | `http://localhost:4000` (só em `DEV`) | **não definida** | Back-end de moedas (`server/`, 006). Indefinida ⇒ moedas desativadas (`coinsEnabled=false`). |
| `VITE_API_BASE_URL` | caminho | `/api` | `/api` | Base do cliente REST simulado. Inalterada. |
| `VITE_SOCKET_URL` | URL | `ws://localhost/realtime` | inalterada | Endpoint Socket.IO **simulado** pelo MSW; não é back-end real. O interceptador do MSW chega a tentar uma conexão nativa a `ws://localhost` (anterior a esta feature); em produção a CSP a bloqueia (ver SC-003). |
| `VITE_REQUEST_TIMEOUT_MS` | inteiro | `8000` | `8000` | Timeout dos clientes Axios. Inalterada. |
| `BACKEND_PROXY_TARGET` | URL | `http://localhost:3000` | n/a | Só dev/preview **local** do Vite (`vite.config.ts`). Em produção quem faz o papel é o rewrite do `vercel.json`. Não é `VITE_*`: não vai para o bundle. |

### Regras de validação

- `VITE_ENABLE_BACKEND_MOCKS` e `VITE_ENABLE_MOCKS` aceitam exatamente `'true'` ou `'false'`; qualquer
  outro valor é tratado como `false` (igual ao `=== 'true'` já usado).
- `coinsEnabled` ⇔ `coinsApiUrl !== undefined`. Em build de produção sem `VITE_COINS_API_URL`, nenhum
  código pode formar uma URL para o back-end de moedas.
- Em build de produção, **nenhuma** variável pode ter `localhost` como valor padrão que sobreviva ao bundle
  (FR-007). `VITE_SOCKET_URL` contém `localhost` mas é um identificador de rota do mock, não uma URL
  alcançada: está listada na verificação de SC-003 como exceção conhecida e justificada.

### Estados derivados

| Condição | Resultado |
|---|---|
| `DEV=true` | mocks de `/api` **e** de `/backend` ligados; moedas apontam para `localhost:4000` (comportamento atual) |
| `DEV=false`, matriz acima | mocks só de `/api`; `/backend` real; moedas desativadas |
| `DEV=false`, `VITE_ENABLE_BACKEND_MOCKS` esquecida | `false` por padrão ⇒ `/backend` real (seguro por omissão) |
| `DEV=false`, API fora do ar | chamadas a `/backend/*` falham de forma visível (`LedgerError`), sem cair no mock |

## Regra de entrega

Par origem → comportamento HTTP, declarado em `apps/web/vercel.json`. Catálogo completo (rewrites, cabeçalhos,
cache e a ordem de avaliação) em `contracts/delivery-rules.md`.
