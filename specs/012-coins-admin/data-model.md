# Data Model: Administração das moedas no site

Nada é persistido pelo site. Os formatos abaixo espelham o que o `apps/api` devolve hoje
(`apps/api/src/routes/admin.ts`) e viram schemas Zod em `apps/web/src/domains/coins-admin/model/contracts.ts`
(validação na borda, Princípio II).

## Entrada (`POST /backend/admin/login`)

| Campo enviado | Regra no site (antes de enviar) |
|---|---|
| `email` | obrigatório, e-mail válido, até 254 caracteres (igual ao serviço) |
| `password` | obrigatória, 1 a 256 caracteres |

Resposta `200`: `{ token: string, expiresAt: ISO string, admin: { id: string, email: string } }`.
Falhas: `400 invalid_login_request`; `401 invalid_credentials` (mesma mensagem para e-mail inexistente e senha errada).

## Sessão do admin de moedas (em memória)

| Campo | Origem | Regra |
|---|---|---|
| `token` | resposta do login | enviado como `Authorization: Bearer` só nas rotas `/backend/admin/*` |
| `expiresAt` | resposta do login | sessão é inválida quando `Date.now() >= expiresAt` (15 min) |
| `adminId`, `email` | resposta do login | exibidos na área ("Conectado como …") |

Nunca em `localStorage`/`sessionStorage`. Encerra em: Sair (motivo `logout`), `expiresAt` vencido e `401`/`403` do
serviço (motivo `expired`). O módulo guarda o último motivo de encerramento até alguém lê-lo (a guarda de rota e o hook de
sessão consomem uma vez; a página de entrada só lê o `reason` da URL). Em **qualquer** encerramento o cache `['coins-admin', …]` é removido, de modo que outro
login, mesmo do mesmo admin, nunca mostra dados da sessão anterior antes da resposta nova.

## Página de donos (`GET /backend/admin/owners?limit=20&cursor=…`)

| Campo | Tipo | Regra |
|---|---|---|
| `owners[].ownerId` | string | identificador do dono |
| `owners[].updatedAt` | ISO string | última movimentação |
| `cursor` | string, opcional | ausente na última página |

Cache: `['coins-admin', adminId, 'owners', cursors.join(',')]`. Ordem estável por `ownerId` (do serviço).

### Pilha de cursores na URL (`/admin/coins?cursors=…`)

`search.cursors: string[]`, validado (cada um 1..2048 caracteres, no máximo 50). Página atual = último cursor (ou a
primeira, se vazio). Próxima: `[...cursors, cursor]`. Anterior: `cursors.slice(0, -1)`.

## Detalhe do dono (`GET /backend/admin/owners/:ownerId`)

| Campo | Tipo |
|---|---|
| `balance` | `{ ownerId, amount (inteiro ≥ 0), version (inteiro ≥ 0), updatedAt }` |
| `transactions[]` | `{ txId, ownerId, direction: 'credit' \| 'debit', amount (> 0), resultingBalance (≥ 0), createdAt }`, até 50, mais recente primeiro |

`ownerId` no endereço: o serviço aceita `[A-Za-z0-9_.-]`, até 128 caracteres; fora disso, `400 invalid_owner_id`, que a
tela mostra como "Identificador de dono inválido." com link para a lista. Dono sem operações: saldo 0 e lista vazia
(não é erro). Cache: `['coins-admin', adminId, 'owner', ownerId]`.

## Erros (`CoinsAdminError`)

| Situação | Status | Mensagem na UI |
|---|---|---|
| Credencial errada | 401 `invalid_credentials` | "E-mail ou senha incorretos." |
| Sessão ausente/expirada/sem papel | 401 / 403 | leva à entrada com "Sua sessão de administrador expirou. Entre de novo." |
| Rede, timeout, 5xx | `null` / ≥ 500 | "Serviço de moedas indisponível. Tente novamente." + "Tentar de novo" |
| Id inválido | 400 `invalid_owner_id` | "Identificador de dono inválido." + "Voltar para a lista" |
| Outro 400 | 400 | mensagem do serviço |

## Mock (`mocks/contexts/coins-admin`)

- Admin de demonstração com e-mail fixo e senha guardada só como **salt + hash PBKDF2**; a senha de demonstração fica
  documentada no README do contexto (como as contas fictícias do site).
- Token `mock-coins-admin.<adminId>.<expiresAtMs>`, 15 min; aceito só nas rotas de admin.
- Donos e extratos lidos do `LedgerService` (011), com `listOwners(limit, cursor)` (ordem por `ownerId`, cursor
  `base64url` do último id) e `ownerDetail(ownerId)` (saldo + 50 últimas operações).
- Cenários: `coins-unavailable` (já existe desde a 011, mas hoje só o contexto `ledger` o consulta; o contexto novo
  passa a consultá-lo também, e então **todas** as rotas `/backend/admin/*`, login incluído, respondem `503`) e
  `coins-admin-session-expired` (novo: todo token de admin ⇒ `401 invalid_token`).
