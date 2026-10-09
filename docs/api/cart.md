# Contrato — Carrinho

Funciona para **visitante** (`X-Anonymous-Id`) e para **sessão** (`Authorization`).
Após autenticar, os itens do visitante são fundidos no carrinho do usuário (merge no login).

## Modelo

```ts
type CartItem = {
  nftId: string;
  name: string; // espelho do NFT (evita roundtrip na UI)
  image: string;
  price: string; // preço ATUAL do catálogo (não é preço de adição)
  qty: number; // inteiro ≥ 1
  available: number; // disponibilidade atual do NFT/edição
  edition: { current: number; total: number };
  lineTotal: string; // price * qty (decimal.js, string)
  updatedAt: string;
};

type Cart = {
  items: CartItem[];
  subtotal: string; // soma de lineTotal
  itemCount: number; // soma de qty
  updatedAt: string;
  version: number; // incrementa a cada mutação/evento nft.updated
};
```

## Endpoints

### `GET /api/cart` 🔒/anon

```jsonc
// 200 OK → Cart   (carrinho vazio: items: [], subtotal: "0")
```

### `POST /api/cart/items` 🔒/anon — adicionar

```jsonc
// request
{ "nftId": "golden-signal-160", "qty": 2 }
// 201 Created → Cart
```

| Status | `code`               | Quando / UI                                                                     |
| -----: | -------------------- | ------------------------------------------------------------------------------- |
|    404 | `NOT_FOUND`          | NFT inexistente                                                                 |
|    409 | `INSUFFICIENT_STOCK` | `qty > available` ou `available === 0` → banner no card + sugestão de menor qtd |
|    422 | `VALIDATION_ERROR`   | `qty` não inteiro ≥ 1                                                           |

**Regra de disponibilidade:** o limite é por NFT/edição (`available`), compartilhado com o
estoque do catálogo. Adicionar além do limite NUNCA aumenta silenciosamente a quantidade.

### `PATCH /api/cart/items/:nftId` 🔒/anon — alterar quantidade

```jsonc
// request
{ "qty": 3 }
// 200 OK → Cart
```

Erros: `404 NOT_FOUND` (item fora do carrinho), `409 INSUFFICIENT_STOCK`
(`qty > available` — a UI mantém o último valor válido e mostra o limite),
`422 VALIDATION_ERROR`.

### `DELETE /api/cart/items/:nftId` 🔒/anon — remover

```jsonc
// 200 OK → Cart
// 404 NOT_FOUND quando o item não existe (a UI trata como sucesso vazio)
```

## Regras

1. **Persistência**: o mock persiste carrinho em `localStorage` (`gm_db_v1`);
   refresh mantém itens. No **login** os itens do visitante são _movidos_ para o carrinho
   do usuário (merge via `anonymousId`); no **logout** os itens privados somem com a
   sessão e o carrinho anônimo inicia vazio (já consumido no merge).
2. **Preço sempre atual**: `price` vem do catálogo corrente; mudanças recebidas por
   `nft.updated` reprecificam o item e disparam aviso na UI ("preço alterado de X para Y")
   - novo subtotal (cenário `preco-muda`).
3. **Fora de ordem**: cada resposta carrega `version`; o cliente descarta `version`
   menor que a última aplicada.
4. **Após confirmação do pedido**: remover do carrinho **apenas** os itens/quantidades
   efetivamente comprados (o restante permanece).

O item do carrinho também expõe `tokenId?: string`, projetado do NFT, para a revisão do pagamento. Respostas legadas sem token usam `nftId` como identificação.
