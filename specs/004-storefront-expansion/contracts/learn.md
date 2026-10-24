# Contract: Aprenda (`pages/learn`, rotas `/learn` e `/learn/$slug`, públicas)

## Fonte de dados (sem endpoint, sem mock)

- `src/pages/learn/content/articles.ts`: array estático `Article[]` (ver data-model.md), bundlado
  com o app. Não há chamada de rede nem camada de mock envolvida — nenhuma mudança em `src/mocks`.

## Lista (`/learn`)

- Grid/lista de `ArticleCard`: título, resumo, tempo de leitura estimado.
- Selecionar um artigo navega para `/learn/$slug`.

## Detalhe (`/learn/$slug`)

- Resolve o artigo pelo `slug` exato no array estático, de forma síncrona (sem estado de
  carregamento assíncrono, já que o dado já está em memória).
- `slug` sem correspondência → renderiza o mesmo padrão de "não encontrado" já usado em outras telas
  (`not-found`), não um erro genérico.

## Conteúdo inicial

Mínimo de 3 artigos em português sobre o tema NFT/marketplace, cobrindo: (1) o que são NFTs, (2)
como funciona uma edição/estoque limitado, (3) como comprar com segurança na plataforma — conteúdo
editorial fixo, mantido pela equipe, sem interface de autoria nesta feature (spec.md, Assumptions).
