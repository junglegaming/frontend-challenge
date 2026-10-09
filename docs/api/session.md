# Contrato — Sessão e Conta

## Modelos

```ts
type UserPublic = {
  id: string;          // "usr_ana"
  name: string;        // "Ana Colecionadora"
  email: string;       // "ana@nft-marketplace.test"
  username?: string;   // "ana.eth"
  bio?: string;
  avatarUrl?: string;  // caminho /assets/... ou data URL
  createdAt: string;   // ISO
};

type Session = {
  token: string;       // opaco, formato "mock.<base64url>" — não é JWT real
  user: UserPublic;
  expiresAt: string;   // ISO — sessão dura 2h no mock
};
```

## Endpoints

### `POST /api/auth/signup` — criar conta (pública)

```jsonc
// request
{ "name": "Carlos Colecionador", "email": "carlos@nft-marketplace.test", "password": "Carlos1234" }
// 201 Created
{ "token": "mock.…", "user": { … }, "expiresAt": "2026-10-07T20:00:00.000Z" }
```

| Regra | Detalhe |
| --- | --- |
| `name` | obrigatório, 2–60 caracteres |
| `email` | obrigatório, formato válido, normalizado lowercase, único |
| `password` | obrigatório, mínimo 8, exige letra + número |

Erros:

| Status | `code` | Quando |
| ---: | --- | --- |
| 422 | `VALIDATION_ERROR` | campos inválidos (`fields` em cada campo) |
| 409 | `CONFLICT` | e-mail já cadastrado (`fields.email`) |

### `POST /api/auth/login` — autenticar (pública)

```jsonc
// request
{ "email": "ana@nft-marketplace.test", "password": "Ana12345", "anonymousId": "uuid-opcional" }
// 200 OK → Session
```

| Regra | Detalhe |
| --- | --- |
| Credenciais | `401 UNAUTHORIZED` com `message` = "E-mail ou senha incorretos" (não revelar qual dos dois falhou; sem `fields`) |
| `anonymousId` | quando presente, o mock **funde o carrinho visitante** no carrinho do usuário (ver `cart.md`) |

Erros: `401 UNAUTHORIZED` (credenciais inválidas), `422 VALIDATION_ERROR`
(`email`/`password` malformados antes da comparação).

### `GET /api/auth/session` 🔒 — hidratação da sessão

```jsonc
// 200 OK → Session
```

| Status | `code` | Quando |
| ---: | --- | --- |
| 401 | `SESSION_EXPIRED` | token conhecido mas expirado |
| 401 | `UNAUTHORIZED` | token desconhecido/ausente |

Chamado uma vez no boot da aplicação (antes de rotas privadas renderizarem).

### `POST /api/auth/logout` 🔒 — encerrar sessão

```jsonc
// 204 No Content
```

Invalida o token no mock (reuso posterior → `401 UNAUTHORIZED`).
Idempotente: logout sem sessão também responde `204`.

## Comportamentos do mock

- Usuários seed: `ana@nft-marketplace.test` / `Ana12345` (perfil completo, carteiras, pedidos) e
  `bruno@nft-marketplace.test` / `Bruno1234` (perfil enxuto) — ver fixtures.
- Senhas nunca persistidas em claro: o mock guarda hash fictício (ex.: `hash:<sha256>`).
- `POST /api/_mock/reset` restaura usuários, sessões e demais entidades ao seed.
- Cenário `sessao-expirada` faz qualquer token expirar imediatamente após o login
  (para exercitar expiração durante a navegação e no checkout).
