# Contratos REST — API Mockada

Fonte de verdade dos endpoints consumidos pelo app e implementados no MSW
(`src/mocks/handlers/`). Os tipos do cliente derivam destes contratos via `z.infer`
e são re-exportados em `src/types/api.ts`.

**Índice:** [sessão](./session.md) · [NFTs](./nfts.md) · [favoritos](./favorites.md) ·
[carrinho](./cart.md) · [cotação](./quote.md) · [pedidos](./orders.md) ·
[perfil](./profile.md) · [carteiras](./wallets.md)

## 1. Convenções

`GET /api/_health` é público e retorna `200 { "ok": true }`, validado por
`healthSchema`. O bootstrap com mocks consulta este endpoint via Axios antes do render.

| Tema         | Regra                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Base URL     | `VITE_API_BASE_URL` — em dev/demo aponta para o próprio bundle (MSW intercepta `*/api/*`)                                        |
| Auth         | header `Authorization: Bearer <token>`; endpoints marcados 🔒 exigem sessão válida                                               |
| Anônimo      | endpoints de carrinho/cotação aceitam header `X-Anonymous-Id` (uuid do visitante, `localStorage gm_anon_id`) quando não há token |
| Conteúdo     | `Content-Type: application/json; charset=utf-8`                                                                                  |
| Moeda        | todos os valores ETH são **string decimal** (`"0.99"`, `"0.0042"`) — nunca `number`                                              |
| Quantidade   | inteiro (`qty`, `available`, `edition.*`)                                                                                        |
| Datas        | ISO 8601 (`"2026-10-07T18:00:00.000Z"`)                                                                                          |
| Endereço     | `0x` + 40 hex, case-insensitive, validado nos dois lados                                                                         |
| Paginação    | request: `page` (1-based, default 1), `pageSize` (default 12, max 48); response: `{ items, page, pageSize, total }`              |
| Versão       | recursos mutáveis carregam `version: number` + `updatedAt`; eventos Socket.IO usam `version` para dedupe/ordem                   |
| Idempotência | header `Idempotency-Key` (UUID v4) **obrigatório** em `POST /api/orders`                                                         |

## 2. Envelope de erro

Toda resposta ≥ 400 tem o formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "fields": { "email": ["Informe um e-mail válido"] },
    "requestId": "req_7f3a"
  }
}
```

`fields` existe em `VALIDATION_ERROR` e em `CONFLICT` quando o contrato do recurso define um campo (erros por campo, associados aos inputs).
`requestId` é opcional e serve para logs/diagnóstico.

## 3. Códigos de erro

| `code`                 | HTTP | Quando                                      | Tratamento de UI                                     |
| ---------------------- | ---: | ------------------------------------------- | ---------------------------------------------------- |
| `VALIDATION_ERROR`     |  422 | payload/formulário inválido                 | erros por campo + resumo                             |
| `UNAUTHORIZED`         |  401 | sem token ou token inválido                 | limpar sessão → `/login?redirect=`                   |
| `SESSION_EXPIRED`      |  401 | havia sessão e ela expirou                  | idem, preservando contexto (rascunho de checkout)    |
| `FORBIDDEN`            |  403 | recurso pertence a outro usuário            | tela de "sem permissão"                              |
| `NOT_FOUND`            |  404 | recurso inexistente                         | 404 da rota / empty state                            |
| `CONFLICT`             |  409 | e-mail/endereço/usuário já existem          | erro no campo correspondente                         |
| `INSUFFICIENT_STOCK`   |  409 | edição/quantidade indisponível              | banner no item + revalidar carrinho                  |
| `QUOTE_STALE`          |  409 | preço/disponibilidade mudou desde a cotação | refetch da cotação + **nova confirmação do usuário** |
| `IDEMPOTENCY_CONFLICT` |  409 | mesma chave, payload diferente              | bloquear reenvio, recuperar pedido existente         |
| `COUPON_INVALID`       |  422 | cupom inexistente                           | erro no input do cupom                               |
| `COUPON_EXPIRED`       |  410 | cupom expirado                              | mensagem específica + remover cupom                  |
| `RATE_LIMITED`         |  429 | cenário de indisponibilidade                | retry com backoff                                    |
| `INTERNAL`             |  500 | falha do servidor mockado                   | ErrorState + "Tentar novamente"                      |
| `SERVICE_UNAVAILABLE`  |  503 | cenário de indisponibilidade                | idem                                                 |

Falha de transporte (rede caiu, timeout sem resposta HTTP) **não** tem envelope —
o Axios vira `AppError { kind: "network" }` e a UI usa `ErrorState` com retry.

## 4. Modelos

Definidos com zod em cada resource file; resumo:

| Modelo                   | Arquivo        | Responsável      |
| ------------------------ | -------------- | ---------------- |
| `Session`, `UserPublic`  | `session.md`   | sessão e conta   |
| `Nft`, `NftListResponse` | `nfts.md`      | catálogo/detalhe |
| `FavoritesResponse`      | `favorites.md` | favoritos        |
| `Cart`, `CartItem`       | `cart.md`      | carrinho         |
| `Quote`, `Coupon`        | `quote.md`     | cotação          |
| `Order`, `OrderItem`     | `orders.md`    | pedidos/recibo   |
| `Profile`                | `profile.md`   | perfil           |
| `Wallet`                 | `wallets.md`   | carteiras        |

## 5. Regras transversais

1. **Isolamento por usuário**: carrinho, favoritos, perfil, carteiras e pedidos são
   endereçados pelo token da sessão (ou `X-Anonymous-Id`). Nunca vazar dados entre usuários —
   troca de sessão limpa o cache do usuário anterior.
2. **Snapshot de pedido**: `Order.items` congela nome/preço no momento da criação;
   mudanças posteriores do catálogo não alteram recibo já confirmado.
3. **Atualizações em tempo real**: mudanças de preço/disponibilidade e status de pedido
   chegam por Socket.IO (`nft.updated`, `order.updated`) — REST continua sendo a
   fonte de verdade na reconexão (ver `ARCHITECTURE.md` §5).
4. **Erros fora de ordem**: respostas obsoletas são descartadas no cliente
   (cancelamento por query key/AbortSignal) — a API não garante ordenação sob latência variável.
