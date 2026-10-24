# Página `learn` — Aprenda

**Rotas:** `/learn` (lista) e `/learn/$slug` (artigo), públicas, sem `beforeLoad`

Conteúdo educativo estático sobre NFTs (`content/articles.ts`) — sem mock/backend, já que não é
dado de usuário/sessão. `/learn/$slug` resolve o artigo sincronamente a partir do array estático;
um slug sem correspondência mostra o padrão de "não encontrado" já usado em outras telas.

**Não usa nenhum domínio** — conteúdo editorial fixo, mantido pela equipe.
