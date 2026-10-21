# Domínio `cart`

Carrinho (visitante e autenticado), cupom e cotação (`Quote`). Usado por `nft-detail`, `cart`, `checkout`, `login`, `signup`.

- Carrinho do visitante persiste após refresh e é mesclado ao autenticar.
- Subtotal, desconto, taxa e total vêm da cotação da API; a UI nunca recalcula o total final.
- Reage a `nft.updated` invalidando carrinho e cotação.
