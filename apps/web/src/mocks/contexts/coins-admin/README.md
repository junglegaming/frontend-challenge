# Contexto `coins-admin` (mock das rotas de admin do `apps/api`)

Simula `POST /backend/admin/login`, `GET /backend/admin/me`, `GET /backend/admin/owners` e
`GET /backend/admin/owners/:ownerId` (specs/012-coins-admin). Só é registrado quando
`VITE_ENABLE_BACKEND_MOCKS=true` (dev e e2e); em produção o `/backend/admin/*` chega ao `apps/api` real.

## Credencial de demonstração

| E-mail | Senha |
| --- | --- |
| `moedas@nft.dev` | `Moedas@123` |

É uma conta **fictícia**, só para o mock. A senha existe aqui apenas como salt + hash PBKDF2-SHA256 (mesmo algoritmo de
`../../infra/password.ts`, 60000 iterações): `service.ts` não contém a senha em claro.

## Comportamento (igual ao `apps/api`)

- E-mail desconhecido e senha errada: **a mesma** resposta `401 invalid_credentials`.
- Token de admin (`mock-coins-admin.<id>.<expira>`) vale 15 minutos e não é renovado.
- Sem token: `401 missing_token`. Token inválido ou vencido: `401 invalid_token`. Token de dono: `403`.
- `GET /admin/owners`: `limit` de 1 a 200 (padrão 50) e `cursor` de 1 a 2048 caracteres, senão `400 invalid_query`;
  donos em ordem crescente de identificador; `cursor` só quando há mais.
- `GET /admin/owners/:ownerId`: `[A-Za-z0-9_.-]`, até 128 caracteres, senão `400 invalid_owner_id`; saldo e as 50
  operações mais recentes (dono sem operações: saldo 0, lista vazia).

## Cenários de falha

- `coins-unavailable`: todas as rotas respondem `503`, login incluído.
- `coins-admin-session-expired`: toda rota autenticada responde `401 invalid_token`.

Os donos e extratos vêm do mesmo estado do mock de moedas (`../ledger`).
