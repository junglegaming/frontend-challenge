# Contrato — Favoritos

Todos os endpoints são 🔒 (exigem sessão) e **isolados por usuário**.

## Modelo

```ts
type FavoritesResponse = {
  ids: string[];   // ids de NFT favoritados por ESTE usuário
  count: number;
};
```

## Endpoints

### `GET /api/favorites` 🔒

```jsonc
// 200 OK
{ "ids": ["golden-signal-160", "sage-nomad-009"], "count": 2 }
```

### `PUT /api/favorites/:nftId` 🔒 — adicionar (idempotente)

```jsonc
// 200 OK → FavoritesResponse (estado completo após a mutação)
```

| Status | `code` | Quando |
| ---: | --- | --- |
| 200 | — | já era favorito (sem efeito colateral, mesma resposta) |
| 404 | `NOT_FOUND` | NFT inexistente |
| 401 | `SESSION_EXPIRED` / `UNAUTHORIZED` | sessão inválida |

### `DELETE /api/favorites/:nftId` 🔒 — remover (idempotente)

```jsonc
// 200 OK → FavoritesResponse
```

Responde `200` mesmo quando o NFT não estava favoritado; `404` só para NFT inexistente.

## Regras de cliente

- **Atualização otimista obrigatória** (escolha do projeto): `onMutate` cancela queries em
  voo, aplica snapshot local, `onError` faz rollback e notifica via toast;
  `onSettled` invalida `favorites` para reconciliar com o servidor.
- Visitante que tenta favoritar → redirect para `/login?redirect=<rota atual>`;
  após login, retorna à origem e a mutation pode ser repetida.
- `favoritesCount` exibido no card usa o valor do catálogo; divergência é resolvida no
  próximo refetch (não bloqueia a UI).
