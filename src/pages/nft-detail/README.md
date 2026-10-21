# Página `nft-detail` — Detalhes do NFT

**Rota:** `/nft/$nftId` (search: `edition`)

Galeria, informações, seleção de edição, quantidade (limite por estoque/pedido), favoritos e compra.
Trata acesso direto, NFT inexistente (404) e edição indisponível/esgotada. Reage a `nft.updated`.

**Usa os domínios:** `catalog`, `favorites`, `cart`.
