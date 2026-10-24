# Página `admin-products` — Administração de Produtos

**Rota:** `/admin/products` (somente administradores — `beforeLoad: requireRole(..., 'admin')`)

Criação de novos anúncios de NFT (com edição inicial), edição de preço/estoque de edições
existentes, remoção de anúncios da vitrine pública (sem apagar histórico de pedidos), e um gerador
de imagem "por IA" (simulado, determinístico) dentro do formulário de criação/edição.

**Usa os domínios:** `admin`, `media-generation`, `catalog` (tipos).
