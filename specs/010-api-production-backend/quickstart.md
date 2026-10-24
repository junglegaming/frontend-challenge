# Quickstart: back-end em produção

Guia de implantação e validação, não de implementação (ver `tasks.md`). Contratos:
`contracts/api-delta.md`, `contracts/verification-suite.md`; tabelas: `data-model.md`.

## Pré-requisitos

- Node 24, pnpm, `vercel` CLI autenticada (`vercel whoami`), projeto ligado em `apps/api` (`vercel link`).
- Constituição **1.6.0** (Prisma ORM com `@prisma/adapter-neon`). Sem ela, o código Prisma não entra (plan.md,
  Complexity Tracking).
- Um ramo Neon por ambiente: desenvolvimento, preview e produção (research D11). Não é preciso Docker: o adaptador
  HTTP do Neon não conversa com um Postgres local comum.
- `pnpm install` na raiz sem aviso de "Ignored build scripts" para `prisma`/`@prisma/engines` (research D15); o
  `postinstall` de `apps/api` gera o cliente em `src/generated/prisma`.

## 1. Banco de desenvolvimento e esquema

```sh
cd apps/api
pnpm exec vercel env pull .env.local --environment=development   # precisa de DATABASE_URL e DATABASE_URL_UNPOOLED
pnpm exec prisma migrate status
```

- **Ramo novo/vazio**: `pnpm db:migrate` (= `prisma migrate deploy`) aplica `0_init`; repetir não faz nada.
- **Ramo que já tem as tabelas da revisão 2** (*baseline*, research D7):

  ```sh
  pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
  pnpm exec prisma migrate resolve --applied 0_init
  ```

  O `diff` precisa sair com código `0` (tabelas, colunas e índices iguais) **antes** do `resolve`. O Prisma não
  compara `CHECK`; confira-os à parte, no console SQL do Neon:
  `SELECT conrelid::regclass, conname FROM pg_constraint WHERE contype = 'c' AND connamespace = 'public'::regnamespace;`
  devem aparecer os `CHECK` de `balances`, `transactions` e `admins` listados em `data-model.md`.

Esperado: `prisma migrate status` termina com "Database schema is up to date!".

## 2. Verificação local (sem implantar)

```sh
pnpm --dir apps/api dev:local            # http://localhost:4001/api
ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD='<senha longa e nova>' pnpm --dir apps/api seed:admin
BASE_URL=http://localhost:4001/api AUTH_JWT_SECRET=<o do .env.local> \
  ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD='<a mesma>' pnpm --dir apps/api verify:deploy
```

Esperado: as 16 checagens `✓`; concorrência com **zero** atualizações perdidas. Sem admin semeado, use
`--skip-admin` (pula as checagens 8, 9, 13 e 16).

**Gate do Prisma** (research D12/D14), ainda local: `verify:deploy --repeat 10` sem nenhuma perda, e a corrida de
20 pedidos simultâneos com a mesma `Idempotency-Key` dando 1 efeito e 20 respostas `200` idênticas (nenhum `500`).

## 3. Ramos do banco por ambiente (precisa de confirmação)

A integração **Neon Postgres** já está instalada no projeto `nft-marketplace-api` e injeta `DATABASE_URL` e
`DATABASE_URL_UNPOOLED` (verificado em 2026-10-24 com `pnpm exec vercel env ls`). **Mas Development, Preview e
Production apontam para o mesmo endpoint** (e o `.env.local` também): sem ramos separados, o teste de preview rodaria
no banco de produção. Separar antes de implantar (o `vercel` não está no PATH do bash; use `pnpm exec vercel`):

1. No console do Neon, criar um ramo `preview` e um ramo `development` a partir do ramo atual (produção).
2. Apontar as variáveis do Vercel desses ambientes para os ramos novos (somente a URL com *pooler* em
   `DATABASE_URL` e a direta em `DATABASE_URL_UNPOOLED`; o ramo atual fica só em Production):

```sh
cd apps/api
pnpm exec vercel env ls          # confira os escopos; nunca imprima os valores
pnpm exec vercel env rm DATABASE_URL preview --yes ; pnpm exec vercel env add DATABASE_URL preview
pnpm exec vercel env rm DATABASE_URL_UNPOOLED preview --yes ; pnpm exec vercel env add DATABASE_URL_UNPOOLED preview
# repetir para development. Se a integração gerencia as variáveis, prefira o painel dela.
```

3. Conferir que os três hosts agora diferem (compare só o nome do host, nunca a URL inteira).

O segredo de assinatura precisa ser distinto por ambiente:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" | pnpm exec vercel env add AUTH_JWT_SECRET preview
# AUTH_JWT_SECRET de production já existe; não reutilize o mesmo valor no preview
```

## 4. Esquema e admin em cada ramo remoto

```sh
pnpm exec vercel env pull .env.preview.local --environment=preview         # arquivos *.local ficam fora do Git
DATABASE_URL_UNPOOLED=<preview direta> pnpm --dir apps/api exec prisma migrate deploy
DATABASE_URL=<preview> ADMIN_EMAIL=... ADMIN_PASSWORD='<nova>' pnpm --dir apps/api exec tsx scripts/seed-admin.ts
# repetir com .env.production.local / <producao>
```

(Passar a variável na linha de comando deixa explícito qual ramo é alterado e não depende do `.env.local`.)
Esperado: `migrate deploy` aplica `0_init` uma vez; `prisma migrate status` no mesmo ramo diz "up to date". Use uma **senha nova**: a antiga esteve legível no Blob público. Apague os arquivos
`.env.*.local` remotos depois.

## 5. Implantar preview e verificar (gate da constituição 1.5.0)

```sh
cd apps/api
pnpm exec vercel deploy                                    # usa framework:null + buildCommand:"" do vercel.json
BASE_URL=https://<preview>.vercel.app/api PROTECTION_BYPASS=<segredo> AUTH_JWT_SECRET=<preview> \
  ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm verify:deploy
```

Esperado: as 16 checagens `✓`. **Não promova sem isso**: é o teste ponta a ponta que a constituição exige antes
de o Blob deixar de ser usado. Se `/api/*` voltar `404` da plataforma, o preset de framework do projeto
sobrescreveu o `vercel.json` (ver `apps/api/README.md`, "Deploying"). `500 missing_database_url` no health indica
variável com nome errado (passo 3). Um `500` em **todas** as rotas logo após o deploy, inclusive `/health`, indica
que o cliente Prisma não foi gerado na instalação da Vercel (ver o log de build: "Ignored build scripts" ou falta
do `postinstall`; research D15).

## 6. Promover a produção e verificar o alias

```sh
pnpm exec vercel promote <url-do-preview>      # ou: vercel deploy --prod
BASE_URL=https://nft-marketplace-api-ochre.vercel.app/api AUTH_JWT_SECRET=<producao> \
  ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm verify:deploy
```

Esperado: 16 de 16 checagens; p95 ≤ 2 s (SC-006). A partir daqui a produção não usa mais o Blob.

## 7. Cadeia ponta a ponta pelo site (FR-003)

```sh
BASE_URL=https://nft-marketplace-web-wheat.vercel.app/backend AUTH_JWT_SECRET=<producao> \
  ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm --dir apps/api verify:deploy
```

Esperado: `GET /backend/health` = `200` da API real, agora com o banco.

## 8. Concorrência repetida (SC-002)

```sh
BASE_URL=https://nft-marketplace-api-ochre.vercel.app/api AUTH_JWT_SECRET=<producao> \
  pnpm --dir apps/api verify:deploy --repeat 10 --skip-admin
```

Esperado: 10 de 10 sem atualização perdida. Recusas da plataforma (403/429 com desafio) aparecem contadas à
parte e não são falha.

## 9. Reverter uma implantação ruim

```sh
pnpm exec vercel rollback                    # volta ao deploy de produção anterior; o banco não é tocado
```

O esquema só muda de forma aditiva, então o deploy anterior continua compatível com o banco. Atenção: voltar para
um deploy **anterior à troca** (código Blob) só funciona enquanto o Blob não tiver sido apagado (passo 10). Se a
falha for de dados, restaurar o ramo do banco no Neon (ponto no tempo).

## 10. Limpeza do armazenamento antigo (precisa de confirmação; depois do passo 6 verde)

Apagar os objetos do store de Blob (registros de admin primeiro), remover o store se nada mais o usa e remover
`BLOB_READ_WRITE_TOKEN` das variáveis do projeto. Confirmar que nenhuma URL antiga de admin responde (checagem 13
com `DIRECT_PROBE_URLS=<urls antigas>`).
