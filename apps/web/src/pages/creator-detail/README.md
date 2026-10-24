# Página `creator-detail` — Detalhe do Criador

**Rota:** `/creators/$creatorId` (pública, sem `beforeLoad`)

Bio do criador + grid de todos os seus NFTs listados. Mostra um estado "não encontrado" quando o
`creatorId` não existe.

**Usa os domínios:** `creators`, `catalog` (reaproveita `NftCard`).
