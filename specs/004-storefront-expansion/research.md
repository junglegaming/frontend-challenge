# Research: Storefront Expansion — Mercado, Criadores, Aprenda

## D1 — Escopo de Mercado: hub curado vs. segundo catálogo

**Decisão**: Mercado não tem grid geral próprio nem paginação própria. Ele é um hub de navegação:
ladrilhos de categoria, uma faixa "em alta" (reaproveitando `catalogQueries.featured()`, já
existente) e uma faixa de "coleções" agrupada no cliente a partir do campo já existente
`Nft.collection` (`src/domains/catalog/model/contracts.ts:82`). Cada ladrilho/item navega para `/`
com `category`/`q` pré-definidos (a home já lê esses parâmetros da URL, per feature 002's
TanStack Router filter-in-URL convention) ou para o detalhe do NFT.

**Razão**: a home (`/`) já cobre busca/filtro/grid/paginação geral (FR-001/FR-002 da 002). Duplicar
isso em `/market` violaria "não introduzir abstrações além do necessário" e criaria duas fontes de
verdade para a mesma função. Um hub curado é a interpretação que agrega valor sem redundância.

**Alternativas consideradas**: um segundo grid completo com seus próprios filtros — rejeitado por
redundância; uma página puramente estática (sem dados reais) — rejeitado porque "em alta" e
"coleções" já têm dados reais disponíveis via `catalogQueries.featured()` sem custo adicional.

## D2 — Modelo de dados de Criadores: novo domínio vs. extensão do catálogo

**Decisão**: novo domínio pequeno `src/domains/creators`, com uma entidade `Creator` derivada (não
persistida) dos NFTs já existentes, agrupados por `artist.id`. O mock-side é uma projeção de
leitura sobre `CatalogRepository` (sem fixtures novas, sem estado duplicado) — determinístico por
construção, já que deriva do mesmo estado do catálogo.

**Razão**: `Nft.artist` hoje é só um resumo embutido (`{id, name, avatarUrl}`), sem bio nem contagem
agregada de NFTs. Um Creator com bio é uma entidade genuinamente nova o suficiente para justificar
seu próprio domínio pequeno (Princípio I: domínios por contexto delimitado), mas não precisa de
armazenamento próprio porque toda a informação necessária (exceto a bio, ver D3) já existe.

**Alternativas consideradas**: estender `catalog` com uma função `catalogQueries.creators()` —
rejeitado porque colocaria uma responsabilidade de "perfil de criador" dentro de um domínio cujo
escopo é NFTs/listagens, não pessoas.

## D3 — Origem da bio do criador (dado que não existe hoje)

**Decisão**: a bio é um texto curto gerado deterministicamente a partir dos dados já existentes do
artista (nome + uma frase template fixa por criador, residente nas fixtures do mock, não em texto
livre editável). Não é um campo arbitrário preenchido por IA nem editável por ninguém nesta feature.

**Razão**: a spec (FR-004) exige "uma bio", mas não existe hoje nenhum campo de biografia na fixture
de `artist`/NFT. Como o conteúdo é só leitura e não transacional, a forma mais simples que respeita
"não adicionar escopo além do necessário" é fixar uma bio curta por criador nas fixtures do mock
(novo campo opcional `bio?: string` seria natural, mas a decisão aqui é mantê-la inteiramente dentro
do mock/fixture, não no contrato `Nft`), evitando qualquer acoplamento novo com o domínio `catalog`.

**Alternativas consideradas**: gerar a bio via o gerador de imagem/IA simulado planejado para a
feature 005 — rejeitado por acoplar duas features independentes sem necessidade.

## D4 — Fidelidade visual sem acesso ao Figma

**Decisão**: as 3 telas seguem a estrutura de conteúdo definida na spec (Assumptions), reaproveitando
os componentes de design system já existentes (`Card`, `Badge`, `NftCard`, etc.) e o layout de
grid/rail já usado em outras telas (ex. `NftGrid`), sem tentar adivinhar detalhes visuais específicos
do Figma. As baselines de regressão visual do Playwright criadas nesta feature são marcadas como
provisórias.

**Razão**: o acesso ao arquivo Figma de referência não foi confirmado durante a especificação (ver
spec.md, Assumptions). Prosseguir com os componentes de design system já validados minimiza o risco
de retrabalho quando o acesso for resolvido — qualquer ajuste futuro será de estilo/disposição, não
de arquitetura ou dados.

**Alternativas consideradas**: bloquear a feature até resolver o acesso ao Figma — rejeitado por
decisão explícita do usuário (ver plano aprovado): a estrutura de conteúdo é suficiente para
prosseguir agora.
