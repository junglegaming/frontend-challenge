# Assets locais do Figma

Execute `pnpm fig:extract` com `FIGMA_TOKEN` em `.env.local` (não versionado).
O token precisa de acesso ao arquivo e permissão `file_content:read`.
`FIGMA_FILE_KEY` permite selecionar outro arquivo; `FIGMA_VERSION` fixa a revisão
da API (a revisão usada está em `icons.json`). Sem versão explícita, usa a atual.

O script lê os quatro PNGs originais de `Frontend Challenge.fig`, verifica 1254×1254
e preserva seus bytes. Os nomes correspondem às URLs das fixtures existentes.
`local-assets.json` registra origem, dimensões e SHA-256.

`file.json` contém a referência completa da API (frames, componentes e estilos).
Os nós Iconly são exportados como SVG, deduplicados por nome, em lotes de até 50.
`icons.json` registra os nós, caminhos e hashes, sem URLs temporárias de download.
As chamadas de imagens usam a mesma versão da referência.

Validação em 08/10/2026: duas extrações consecutivas geraram hashes SHA-256
idênticos para todos os JSONs, 17 SVGs e quatro PNGs. Para reproduzir após alterações
no Figma, configure `FIGMA_VERSION` com a versão registrada e mantenha o mesmo `.fig`.
