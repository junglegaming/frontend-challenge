# Contract: Design Tokens

Fonte única: o bloco de tokens em `src/index.css`. Nenhuma tela define cor, fonte ou espaçamento fora dele.

## Cores

| Token | Valor | Uso | Texto permitido sobre ele |
|-------|-------|-----|---------------------------|
| `--background` | `#140D0A` | Fundo da página | `--foreground`, `--muted-foreground`, `--primary`, `--ring` |
| `--card` / `--popover` / `--secondary` | `#241612` | Superfícies (menu lateral, cards, navbar, dock) | idem |
| `--primary` | `#D28A4C` | Botão primário, item ativo, selo, asterisco de destaque | `--primary-foreground` (`#140D0A`) |
| `--muted-foreground` | `#B39463` | Texto secundário, ícones inativos | — (só sobre background/card) |
| `--foreground` / `--card-foreground` | `#F5F1EB` | Texto principal, rótulos | — |
| `--ring` | `#CFB28C` | Anel de foco (3 px), hover de realce | — |
| `--border` | `#B39463` a 35% de opacidade | Divisores decorativos (não delimitam controles) | — |
| `--input` | `#B39463` a 65% de opacidade | Borda de campos e controles interativos (≥ 3:1) | — |
| `--destructive` | coral da referência (`#FF7A59`) | Erro e marcador de obrigatório | — |
| `--success`, `--warning` | tokens de estado existentes | Feedback | — |

Regras: contraste ≥ 4,5:1 (3:1 para texto grande, bordas de componentes e foco); estado nunca só por cor.

## Tipografia

`--font-sans` e `--font-mono` = `'Space Mono', ui-monospace, monospace`.

| Nível | Tamanho / peso / linha |
|-------|------------------------|
| `title` | 16 px / 700 / 1,5 |
| `body` e rótulo | 14 px / 400 / 1,5 |
| `action` | 14 px / 700 / 1,5 |
| `caption` | 12 px / 400 / 1,5 (somente texto auxiliar não essencial) |

## Espaçamento, raio, tamanho

- Escala: 4, 8, 12, 16, 24, 32, 48 px. Rótulo→campo 8; campo→grupo 24; seção→seção 32.
- Raios: `sm` 4 (campos, botões), `md` 8, `lg` 20 (cards).
- Altura de controles: 40 px (44 px de área de toque em telas de toque).
- Contêiner: largura máxima 1200 px, gutter 16 (mobile) / 24 (tablet).

## Pontos de quebra

| Nome | Largura | Regras |
|------|---------|--------|
| `mobile` | < 768 (validar 390) | 1 coluna; navbar compacta; dock visível; menu lateral vira lista/abas no topo |
| `tablet` | ≥ 768 (validar 768) | navbar completa; dock oculta; formulários em 2 colunas; menu lateral colapsável se faltar espaço |
| `desktop` | ≥ 1024 (validar 1440) | menu lateral + conteúdo, como na referência |

## Movimento

Toda animação (shimmer, transições) é suprimida/reduzida sob `prefers-reduced-motion: reduce`.

## Contraste medido (WCAG 2.x)

Calculado com a fórmula de luminância relativa; bordas compostas sobre o fundo indicado.

| Par | Fundo | Razão | Exigido | Resultado |
|-----|-------|-------|---------|-----------|
| `--foreground` `#F5F1EB` | `#140D0A` | 17,10:1 | 4,5 | OK |
| `--foreground` `#F5F1EB` | `#241612` | 15,57:1 | 4,5 | OK |
| `--muted-foreground` `#B39463` | `#140D0A` | 6,72:1 | 4,5 | OK |
| `--muted-foreground` `#B39463` | `#241612` | 6,12:1 | 4,5 | OK |
| `--primary` `#D28A4C` (texto/ícone) | `#140D0A` | 6,85:1 | 4,5 | OK |
| `--primary` `#D28A4C` (texto/ícone) | `#241612` | 6,24:1 | 4,5 | OK |
| `--primary-foreground` `#140D0A` (texto de botão) | `#D28A4C` | 6,85:1 | 4,5 | OK |
| `--ring` `#CFB28C` (foco) | `#140D0A` | 9,53:1 | 3 | OK |
| `--ring` `#CFB28C` (foco) | `#241612` | 8,68:1 | 3 | OK |
| `--destructive` `#FF7A59` | `#140D0A` | 7,49:1 | 4,5 | OK |
| `--destructive` `#FF7A59` | `#241612` | 6,83:1 | 4,5 | OK |
| `--input` (65%) | `#140D0A` | 3,47:1 | 3 | OK |
| `--input` (65%) | `#241612` | 3,34:1 | 3 | OK |
| `--success` `#4ADE80` | `#140D0A` | 11,04:1 | 4,5 | OK |
| `--warning` `#FBBF24` | `#140D0A` | 11,52:1 | 4,5 | OK |

Nota: com 35% de opacidade a borda daria 1,82:1 (reprova o critério de 3:1 para controles), por isso `--input` usa 65% e `--border` fica restrito a divisores decorativos.
