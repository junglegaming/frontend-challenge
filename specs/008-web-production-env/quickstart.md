# Quickstart: Ambiente de produção do front-end

Guia de publicação e validação. Não é guia de implementação (ver `tasks.md`). Contratos:
`contracts/delivery-rules.md`; variáveis: `data-model.md`.

## Pré-requisitos

- Node 22, pnpm, `vercel` CLI autenticada (`vercel whoami`).
- Projeto da API (`nft-marketplace-api`) já publicado **e respondendo** — ver a verificação do passo 6.
- Pelo menos uma execução limpa de `pnpm install` na raiz.

## 1. Validar o build de produção localmente (sem Vercel)

```sh
# na raiz
pnpm --dir apps/web build
# o que NÃO pode aparecer no bundle de aplicação (SC-003); VITE_SOCKET_URL é a exceção documentada
grep -rn "localhost" apps/web/dist/assets | grep -v "ws://localhost/realtime"
# MUST não imprimir nada
```

Variáveis de produção para o build local (espelham a matriz):

```sh
VITE_ENABLE_MOCKS=true VITE_ENABLE_BACKEND_MOCKS=false pnpm --dir apps/web build
```

## 2. Smoke do build de produção (config Playwright separada `playwright.production.config.ts`)

```sh
pnpm --dir apps/web test:e2e:production
```

Esperado: moedas ocultas em carteiras e checkout, **0** requisições a `localhost`, **0** violações de
CSP no console, `/backend/health` **não** atendido pelo mock.

## 3. Vincular o projeto e configurar variáveis

```sh
cd apps/web
vercel link --project nft-marketplace-web
# Root Directory = apps/web, "incluir arquivos fora do Root Directory" ligado (monorepo pnpm)
for env in preview production; do
  printf 'true'    | vercel env add VITE_ENABLE_MOCKS          $env
  printf 'false'   | vercel env add VITE_ENABLE_BACKEND_MOCKS  $env
  printf '/backend' | vercel env add VITE_BACKEND_BASE_URL     $env
done
# VITE_COINS_API_URL: de propósito NÃO definida (moedas desativadas em produção)
vercel env ls
```

## 4. Publicar um preview

```sh
cd apps/web
vercel deploy
```

Previews são protegidos pela Vercel; para validar com `curl`/Playwright use o segredo de bypass do projeto
(`x-vercel-protection-bypass`).

## 5. Verificar a entrega (`$URL` = URL do preview, com bypass)

```sh
# fallback da SPA (SC-001): MUST ser 200 text/html, nunca 404
for p in / /nft/nft_001 /cart /checkout /account/profile /account/wallets; do
  curl -s -o /dev/null -w "$p %{http_code} %{content_type}\n" -H "x-vercel-protection-bypass: $BYPASS" $URL$p
done

# asset ausente é 404, não index.html (contrato de entrega)
curl -s -o /dev/null -w "%{http_code}\n" -H "x-vercel-protection-bypass: $BYPASS" $URL/assets/nao-existe.js   # 404

# cache (SC-004)
curl -sI -H "x-vercel-protection-bypass: $BYPASS" $URL/                      | grep -i cache-control   # no-cache
curl -sI -H "x-vercel-protection-bypass: $BYPASS" $URL/mockServiceWorker.js  | grep -i cache-control   # no-cache
curl -sI -H "x-vercel-protection-bypass: $BYPASS" $URL/assets/<um-arquivo>.js | grep -i cache-control  # immutable

# cabeçalhos de segurança (FR-010)
curl -sI -H "x-vercel-protection-bypass: $BYPASS" $URL/ | grep -iE "x-content-type|referrer-policy|x-frame|permissions-policy|content-security"
```

## 6. Verificar a ligação com a API real (US2 / SC-002)

```sh
curl -s -H "x-vercel-protection-bypass: $BYPASS" $URL/backend/health
```

- Esperado: `{"status":"ok"}` vindo da **API real**. Para distinguir do mock, compare com a API direta:
  `curl -s https://nft-marketplace-api-ochre.vercel.app/api/health`.
- **Se a API devolver `404`**: US2 está bloqueada (FR-013). Não promova como concluída; resolva a 007
  (T022/T023) primeiro. US1 e US3 seguem válidas.
- Fluxo completo (token → crédito → débito → saldo): mesmo roteiro do `quickstart.md` da 007, trocando a base
  por `$URL/backend`.

## 7. Smoke no preview publicado + Lighthouse (SC-005)

```sh
PLAYWRIGHT_BASE_URL=$URL PROTECTION_BYPASS=$BYPASS \
  pnpm --dir apps/web test:e2e:production
LIGHTHOUSE_BASE_URL=$URL LIGHTHOUSE_BYPASS=$BYPASS LIGHTHOUSE_URLS=/,/nft/nft_001 pnpm --dir apps/web lighthouse   # apontando para o build publicado
```

## 8. Promover para produção

```sh
cd apps/web
vercel deploy --prod
```

Repita os passos 5 e 6 contra a URL de produção **sem** bypass (o domínio de produção é público).
Registre o resultado do Lighthouse.

## Reverter

`vercel rollback` (deploy anterior) ou `vercel promote <url-de-um-deploy-bom>`; variáveis `VITE_*` exigem
novo deploy para valer.
