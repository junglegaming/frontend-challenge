# Contrato — Carteiras

Endpoints 🔒, isolados por usuário. O layout prevê **no máximo duas** carteiras:
**principal** e **secundária**.

## Modelo

```ts
type Wallet = {
  id: string; // "wal_ana_principal"
  label: string; // apelido da carteira ("Carteira principal")
  address: string; // "0x…" (40 hex)
  network: 'ethereum' | 'sepolia';
  isPrimary: boolean; // exatamente um (ou nenhum)
  ensName?: string; // "ana.eth"
  note?: string; // "Observação do colecionador"
  createdAt: string;
};
```

## Endpoints

### `GET /api/wallets` 🔒

```jsonc
// 200 OK
{ "items": [/* Wallet[] — no máx. 2 */] }
```

### `POST /api/wallets` 🔒 — cadastrar

```jsonc
// request
{
  "label": "Carteira principal",
  "address": "0xAbC…40hex",
  "network": "ethereum",
  "isPrimary": true,
  "ensName": "ana.eth", // opcional
  "note": "…", // opcional
}
// 201 Created → Wallet
```

| Status | `code`             | Quando / UI                                                                                           |
| -----: | ------------------ | ----------------------------------------------------------------------------------------------------- |
|    409 | `CONFLICT`         | endereço já cadastrado pelo usuário (`fields.address`) — mesmo endereço em outra rede também conflita |
|    409 | `CONFLICT`         | já existem 2 carteiras (`fields.form`: "Limite de duas carteiras atingido")                           |
|    422 | `VALIDATION_ERROR` | endereço fora do padrão `0x`+40 hex, `label` vazio, rede inválida                                     |

### `PATCH /api/wallets/:id` 🔒 — editar

```jsonc
// request (parcial)
{ "label": "Principal", "note": "…", "isPrimary": true, "network": "sepolia" }
// 200 OK → Wallet
```

| Regra                | Detalhe                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Promover a principal | `isPrimary: true` **inverte** a anterior (a secundária vira principal) — transação única no mock                                   |
| Rede                 | atualizar `network` é permitido; se houver pedido pendente vinculado, responder `409 CONFLICT` (evita mudar rede durante checkout) |
| Endereço             | editável por PATCH no checkout; duplicidade e pedido pendente bloqueiam a alteração                                                |

Erros: `404 NOT_FOUND` (id inexistente), `403 FORBIDDEN` (carteira de outro usuário —
mesma convenção dos pedidos), `409 CONFLICT`, `422 VALIDATION_ERROR`.

## Fluxo no checkout

1. `GET /api/wallets` popula o seletor de carteira (vazio → CTA "Cadastre em Carteiras").
2. Usuário escolhe carteira + rede (`select` com `ethereum`/`sepolia`).
3. **Simulação de conexão** (client-side, sem blockchain): estados
   `disconnected → connecting → connected | rejected`. A ação "Confirmar compra" abre
   o diálogo de autorização; rejeitar ou fechar impede a criação do pedido.
   Não há botão separado de conexão.
4. Carteira selecionada + rede escolhida entram no `POST /api/orders`.

## Edição no formulário de pagamento (tarefa 12)

O checkout também pode atualizar os campos da carteira selecionada por PATCH:
`address`, `network`, `provider`, `ensName`, `secondaryIdentity` e `note`.
`provider` é `metamask | walletconnect | coinbase`; ausência em carteiras legadas
é tratada como `metamask` na interface. `ensName` é vazio ou um nome `.eth` válido;
`secondaryIdentity` é vazio, endereço `0x` + 40 hex, ou nome `.eth`.

`secondaryIdentity` é uma referência opcional da carteira, não cadastra uma terceira
carteira nem representa uma conexão adicional. Observação do checkout tem limite
local de 280 caracteres. Endereço, rede e tipo são obrigatórios no formulário.

Endereço editável é uma ampliação autorizada na tarefa 12. Duplicidade com outra
carteira do usuário retorna 409 CONFLICT (`fields.address`). Mudanças de endereço,
rede ou provider enquanto houver pedido pendente vinculado retornam 409 CONFLICT.
O snapshot de pedidos antigos não é alterado. Mudanças de identidade da carteira
no formulário invalidam conexão e revisão; a ação "Confirmar compra" valida e atualiza os dados antes da autorização simulada.

O checkout exige `ensName` e usa um Select de nomes `.eth` (carteira atual, `nft-marketplace.eth`, `colecionador.eth`). O formulário inicia em `nft-marketplace.eth` quando não há ENS. Essa seleção é informativa e simulada, sem consulta ou registro de domínio. O contrato geral continua permitindo carteiras sem ENS. A seleção de provider abaixo da revisão é um grupo de rádios sincronizado com "Tipo de carteira"; a autorização é aberta pela ação "Confirmar compra", sem botão "Conectar carteira".
