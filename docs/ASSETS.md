# Origem dos assets

Referência visual: [Frontend Challenge no Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

As imagens foram obtidas das exportações de Figma disponibilizadas no [PR de referência](https://github.com/junglegaming/frontend-challenge/pull/2), em `theviniis/frontend-challenge`. O manifesto [local-assets.json](https://github.com/theviniis/frontend-challenge/blob/main/docs/figma/local-assets.json) identifica os arquivos como provenientes de `Frontend Challenge.fig`.

| Arquivo local otimizado | Exportação de origem | SHA-256 do PNG original |
| --- | --- | --- |
| `golden-signal.webp` | `public/assets/nft/golden-signal-160.png` | `f20b58b99de12b6eceede2090607e4b999275bba95de7674bb14f26b59666b21` |
| `sage-nomad.webp` | `public/assets/nft/sage-nomad-009.png` | `9b25d8d72395aa62f919f6ad33b95b7ba7bbfee6049e95cf159a319b03ecb8d9` |
| `violet-nomad.webp` | `public/assets/nft/violet-nomad-314.png` | `2a42ba5adc341c3d0e1ad6905058e2762d995fc988113a7cd28b0d15f6a4ba28` |
| `golden-frequency.webp` | `public/assets/nft/golden-frequency-071.png` | `326df4c1c08c31c88b9f407e51be3991e46667183af62aa1501927adc76f52b5` |

Imagens otimizadas em `public/art`, 720 × 720 pixels, WebP qualidade 86. Para reproduzir a conversão: `node scripts/optimize-assets.mjs`. O script baixa os PNGs originais quando necessário, verifica seus hashes e mantém uma cópia local em `assets/source`, fora do controle de versão. A execução da aplicação usa apenas os WebP já incluídos no repositório e não depende desses downloads.

As imagens são utilizadas exclusivamente como assets da entrega deste desafio. A presença no repositório de referência não altera a titularidade da arte. Ícones: Lucide; componentes acessíveis: Radix/shadcn. A marca textual e o favicon desta solução foram construídos localmente. Tipografia de sistema, sem dependência de fontes remotas.
