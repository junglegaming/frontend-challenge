# Domínio `media-generation`

Gerador de imagem "por IA" inteiramente simulado: a mesma descrição de texto sempre produz a mesma
imagem (determinístico), sem chamar nenhum serviço externo. Reaproveita a lógica de desenho de
`scripts/generate-art.mjs` via `src/mocks/infra/placeholder-art.mjs` (uma única implementação).

**Público**: `GeneratedImage`, `useGenerateImage()`.

**Usado por**: `pages/admin-products` (formulário de criação/edição de anúncio).
